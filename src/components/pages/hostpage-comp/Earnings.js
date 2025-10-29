import React, { useEffect, useState, useCallback } from "react";
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const Earnings = () => {
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showPayPalModal, setShowPayPalModal] = useState(false);
 

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
      } else {
        setWalletBalance(0);
      }
    } catch (err) {
      console.error("Error fetching wallet balance:", err);
    }
  }, []);

  useEffect(() => {
    fetchTotalEarnings();
    fetchWalletBalance();
  }, [fetchTotalEarnings, fetchWalletBalance]);

  // Handle Cash Out button click
  const handleCashOutClick = () => {
    if (walletBalance <= 0) {
      alert("Your eWallet balance is 0. Nothing to withdraw.");
      return;
    }
    setShowPayPalModal(true);
  };

  // Handle successful withdrawal
  const handleWithdrawalSuccess = async (details) => {
    alert(`Withdrawal successful! Transaction ID: ${details.id}`);

    try {
      // Reset wallet balance to 0 after successful withdrawal
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { ewallet: 0 });
      setWalletBalance(0);
    } catch (err) {
      console.error("Error updating wallet after withdrawal:", err);
    }

    setShowPayPalModal(false);
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
          className="bg-olive-dark text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
        >
          Cash Out
        </button>
      </div>

      {/* PayPal Cash Out Modal */}
      {showPayPalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-[90%] max-w-md text-center">
            <h3 className="text-lg font-semibold mb-4">Withdraw to PayPal</h3>
            <p className="text-gray-600 mb-4">
              You are about to withdraw ₱{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} to your PayPal account.
            </p>

            <PayPalScriptProvider options={{ "client-id": "AVOE8rOmi0NKq68uIC51xVdcTFzxDptRhJu9GL10VQdPnTf2t32Eo2i9E8ZTp8sAxRRpX3arJAoAa5N2", currency: "PHP" }}>
              <PayPalButtons
                style={{ layout: "vertical", color: "gold" }}
                createOrder={(data, actions) => {
                  return actions.order.create({
                    purchase_units: [
                      {
                        amount: {
                          currency_code: "PHP",
                          value: walletBalance.toFixed(2),
                        },
                      },
                    ],
                  });
                }}
                onApprove={async (data, actions) => {
                  const details = await actions.order.capture();
                  handleWithdrawalSuccess(details);
                }}
                onError={(err) => {
                  console.error("PayPal withdrawal error:", err);
                  alert("Withdrawal failed. Please try again.");
                }}
              />
            </PayPalScriptProvider>

            <button
              onClick={() => setShowPayPalModal(false)}
              className="mt-4 text-gray-500 hover:text-black"
            >
              Cancel
            </button>
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
