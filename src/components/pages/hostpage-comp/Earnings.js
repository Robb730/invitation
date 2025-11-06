import React, { useEffect, useState, useCallback } from "react";
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import { Wallet, CreditCard, DollarSign } from "lucide-react";

const Earnings = () => {
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [cashoutAmount, setCashoutAmount] = useState("");

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

  // Open modal
  const handleCashOutClick = () => {
    if (walletBalance <= 0) {
      alert("Your eWallet balance is 0. Nothing to withdraw.");
      return;
    }
    setShowModal(true);
  };

  // Handle actual payout
  const handleCashOut = async () => {
    const amount = parseFloat(cashoutAmount);
    if (!paypalEmail.trim()) {
      alert("Please enter your PayPal email.");
      return;
    }
    if (isNaN(amount) || amount < 500) {
      alert("Minimum cashout amount is ₱500.");
      return;
    }
    if (amount > walletBalance) {
      alert("You cannot withdraw more than your current balance.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://custom-email-backend.onrender.com/api/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostId: auth.currentUser.uid,
          amount,
          paypalEmail,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ Withdrawal successful! Funds sent to your PayPal account.");
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          ewallet: walletBalance - amount,
        });
        setWalletBalance(walletBalance - amount);
        setShowModal(false);
        setPaypalEmail("");
        setCashoutAmount("");
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
    <div className="bg-white/80 backdrop-blur-lg border border-white/30 rounded-3xl shadow-md p-8 w-full">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-olive-dark mb-2 tracking-tight">
          Earnings Overview
        </h2>
        <p className="text-olive-dark/70 text-sm md:text-base">
          Track your total earnings and manage PayPal transfers here.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 gap-5">
        {/* Total Earnings */}
        <div className="bg-beige p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all duration-300 border border-white/40">
          <div className="p-3 bg-olive/10 rounded-full mb-3">
            <DollarSign className="w-6 h-6 text-olive-dark" />
          </div>
          <h3 className="text-sm text-olive-dark/70 font-medium mb-1">
            Total Earnings
          </h3>
          <p className="text-3xl font-bold text-olive-dark">
            ₱{totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Wallet Balance */}
        <div className="bg-beige p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all duration-300 border border-white/40">
          <div className="p-3 bg-olive/10 rounded-full mb-3">
            <Wallet className="w-6 h-6 text-olive-dark" />
          </div>
          <h3 className="text-sm text-olive-dark/70 font-medium mb-1">
            Current E-Wallet Balance
          </h3>
          <p className="text-3xl font-bold text-olive-dark">
            ₱{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Cash Out Button */}
      <div className="mt-8 text-center">
        <button
          onClick={handleCashOutClick}
          disabled={loading}
          className={`px-8 py-3 rounded-xl text-white text-lg font-medium shadow-md transition-all duration-300 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-olive-dark hover:bg-olive hover:shadow-lg"
          }`}
        >
          {loading ? "Processing..." : "Cash Out"}
        </button>
      </div>

      {/* PayPal Email + Amount Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] ">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-[90%] max-w-md border border-white/40 relative mt-20">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-olive-dark/70 hover:text-olive-dark transition"
            >
              ✕
            </button>

            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-3 bg-beige rounded-full mb-3">
                <CreditCard className="text-olive-dark w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-olive-dark mb-1">
                Withdraw Funds
              </h3>
              <p className="text-olive-dark/70 text-sm">
                Enter your PayPal email and amount to withdraw (₱500 minimum).
              </p>
            </div>

            {/* Amount Input */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-olive-dark mb-2">
                Amount to Cash Out
              </label>
              <input
                type="number"
                placeholder="₱500 minimum"
                min="500"
                value={cashoutAmount}
                onChange={(e) => setCashoutAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-olive-dark/60"
              />

              {/* Suggested buttons */}
              <div className="flex justify-center gap-3 mt-3">
                {[500, 1000, 10000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashoutAmount(amt)}
                    className="px-4 py-2 bg-beige text-olive-dark font-medium rounded-lg hover:bg-olive-dark hover:text-white transition"
                  >
                    ₱{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-olive-dark mb-2">
                PayPal Email
              </label>
              <input
                type="email"
                placeholder="yourname@example.com"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-olive-dark/60"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 text-olive-dark/70 hover:text-olive-dark font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCashOut}
                disabled={loading}
                className={`px-6 py-2 rounded-lg text-white font-medium transition ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-olive-dark hover:bg-olive"
                }`}
              >
                {loading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Message */}
      {totalEarnings === 0 && (
        <p className="mt-6 text-olive-dark/60 text-center italic">
          No transactions yet.
        </p>
      )}
    </div>
  );
};

export default Earnings;
