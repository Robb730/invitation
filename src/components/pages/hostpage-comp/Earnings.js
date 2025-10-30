import React, { useEffect, useState, useCallback } from "react";
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";

const Earnings = () => {
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState("");

  // Fetch total earnings
  const fetchTotalEarnings = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const reservationsRef = collection(db, "reservations");
      const q = query(reservationsRef, where("hostId", "==", auth.currentUser.uid));
      const snapshot = await getDocs(q);

      let sum = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        sum += data.totalAmount || 0;
      });

      setTotalEarnings(sum);
    } catch (err) {
      console.error("Error fetching total earnings:", err);
    }
  }, []);

  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const host = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(host);
      if (snap.exists()) {
        setWalletBalance(snap.data().ewallet || 0);
      }
    } catch (err) {
      console.error("Error fetching wallet balance:", err);
    }
  }, []);

  useEffect(() => {
    fetchTotalEarnings();
    fetchWalletBalance();
  }, [fetchTotalEarnings, fetchWalletBalance]);

  // Open modal when cashout is clicked
  const handleCashOutClick = () => {
    if (walletBalance <= 0) {
      alert("Your eWallet balance is 0. Nothing to withdraw.");
      return;
    }
    setShowModal(true);
  };

  // Handle actual payout
  const handleCashOut = async () => {
    if (!paypalEmail.trim()) {
      alert("Please enter your PayPal email.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://custom-email-backend.onrender.com/api/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostId: auth.currentUser.uid,
          amount: walletBalance,
          paypalEmail: paypalEmail,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ Withdrawal successful! Funds sent to your PayPal account.");
        await updateDoc(doc(db, "users", auth.currentUser.uid), { ewallet: 0 });
        setWalletBalance(0);
        setShowModal(false);
        setPaypalEmail("");
      } else {
        alert("❌ Withdrawal failed: " + data.message);
      }
    } catch (error) {
      console.error("Cash out error:", error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 w-full">
      <h2 className="text-xl font-semibold text-olive-dark mb-4">Earnings</h2>
      <p className="text-gray-600 mb-6">
        Track your total earnings and PayPal transfers here.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-beige p-4 rounded-xl text-center shadow-sm">
          <h3 className="text-sm text-gray-600 mb-1">Total Earnings</h3>
          <p className="text-2xl font-semibold text-olive-dark">
            ₱{totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-beige p-4 rounded-xl text-center shadow-sm">
          <h3 className="text-sm text-gray-600 mb-1">Current E-Wallet Balance</h3>
          <p className="text-2xl font-semibold text-olive-dark">
            ₱{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={handleCashOutClick}
          disabled={loading}
          className={`px-6 py-2 rounded-lg text-white ${
            loading ? "bg-gray-400" : "bg-olive-dark hover:opacity-90"
          } transition`}
        >
          {loading ? "Processing..." : "Cash Out"}
        </button>
      </div>

      {/* PayPal Email Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-[90%] max-w-md">
            <h3 className="text-lg font-semibold text-olive-dark mb-3 text-center">
              Enter PayPal Email
            </h3>
            <p className="text-gray-600 text-sm mb-4 text-center">
              Enter your PayPal email address where the funds will be sent.
            </p>
            <input
              type="email"
              placeholder="yourname@example.com"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-olive-dark"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-500 hover:text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleCashOut}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-white ${
                  loading ? "bg-gray-400" : "bg-olive-dark hover:opacity-90"
                } transition`}
              >
                {loading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-gray-500 text-center">
        {totalEarnings === 0 ? "No transactions yet." : ""}
      </div>
    </div>
  );
};

export default Earnings;
