import React, { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import {
  DollarSign,
  Wallet,
  CreditCard,
  TrendingUp,
  Download,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cashoutRequest } from "../../../utils/cashoutSystem";

const Earnings = () => {
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [cashoutAmount, setCashoutAmount] = useState("");

  const [cashouts, setCashouts] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Fetch total earnings
  const fetchTotalEarnings = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const reservationsRef = collection(db, "reservations");
      const q = query(
        reservationsRef,
        where("hostId", "==", auth.currentUser.uid)
      );
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
  // Fetch cashout history
  // Fetch cashout history
  const fetchCashoutHistory = useCallback(async () => {
    if (!auth.currentUser) return;
    setHistoryLoading(true);
    try {
      const cashoutsRef = collection(db, "cashouts");
      const q = query(cashoutsRef, where("hostId", "==", auth.currentUser.uid));
      const snapshot = await getDocs(q);

      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Sort by createdAt **most recent first**
      list.sort((a, b) => {
        const dateA = a.createdAt?.toDate
          ? a.createdAt.toDate().getTime()
          : new Date(a.createdAt).getTime();
        const dateB = b.createdAt?.toDate
          ? b.createdAt.toDate().getTime()
          : new Date(b.createdAt).getTime();
        return dateB - dateA; // reverse order
      });

      setCashouts(list);
    } catch (err) {
      console.error("Error fetching cashout history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTotalEarnings();
    fetchWalletBalance();
    fetchCashoutHistory();
  }, [fetchTotalEarnings, fetchWalletBalance, fetchCashoutHistory]);

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

    cashoutRequest(auth.currentUser.uid, amount, paypalEmail);

    alert("Cashout request sent.");

    setCashoutAmount("");
    setPaypalEmail("");

    setLoading(false);

    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 rounded-3xl to-teal-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-olive to-olive-dark rounded-xl shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-olive to-olive-darker bg-clip-text text-transparent">
              Earnings
            </h1>
          </div>
          <p className="text-gray-600 text-lg ml-14">
            Track your income and manage cashouts seamlessly
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Total Earnings Card */}
          <div className="group relative bg-gradient-to-br from-white to-green-50 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-green-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/30 to-emerald-200/30 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-olive to-olive-darker rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                  All Time
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2 uppercase tracking-wide">
                Total Earnings
              </h3>
              <p className="text-4xl font-bold text-gray-900 mb-1">
                ₱
                {totalEarnings.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div className="group relative bg-gradient-to-br from-white to-emerald-50 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-emerald-100 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-olive to-olive-darker rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                  Available
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-2 uppercase tracking-wide">
                Current Balance
              </h3>
              <p className="text-4xl font-bold text-gray-900 mb-1">
                ₱
                {walletBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Cash Out Button */}
        <div className="mb-12 flex justify-center">
          <button
            onClick={handleCashOutClick}
            disabled={loading}
            className={`group relative px-10 py-4 rounded-2xl text-white text-lg font-semibold shadow-xl transition-all duration-300 overflow-hidden ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-olive hover:from-olive hover:to-olive-darker hover:shadow-2xl hover:scale-105 active:scale-95"
            }`}
          >
            <span className="relative z-10 flex items-center gap-3">
              <Download className="w-5 h-5" />
              {loading ? "Processing..." : "Withdraw to PayPal"}
            </span>
            {!loading && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            )}
          </button>
        </div>

        {/* Cashout History */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
              <Clock className="w-6 h-6 text-green-700" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Withdrawal History
            </h2>
          </div>

          {historyLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading history...</p>
            </div>
          ) : cashouts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No withdrawals yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Your withdrawal history will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-olive to-olive-darker">
                    <tr>
                      <th className="py-4 px-6 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        ID
                      </th>
                      <th className="py-4 px-6 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        PayPal Email
                      </th>
                      <th className="py-4 px-6 text-center text-xs font-semibold text-white uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="py-4 px-6 text-center text-xs font-semibold text-white uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-4 px-6 text-center text-xs font-semibold text-white uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cashouts.map((c, idx) => (
                      <tr
                        key={c.id}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="py-4 px-6">
                          <span className="font-mono text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                            {c.id}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          {c.paypalEmail}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="font-bold text-lg text-gray-900">
                            ₱{c.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold ${
                              c.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                : c.status === "Approved"
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : "bg-red-100 text-red-800 border border-red-200"
                            }`}
                          >
                            {c.status === "Pending" && (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                            {c.status === "Approved" && (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            {c.status === "Rejected" && (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center text-sm text-gray-600">
                          {c.createdAt?.toDate
                            ? c.createdAt.toDate().toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : new Date(c.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* PayPal Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg transform transition-all animate-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-olive to-olive-darker rounded-t-3xl p-8 text-white">
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-200"
                >
                  <span className="text-2xl font-light">×</span>
                </button>
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">Withdraw Funds</h3>
                    <p className="text-green-100 text-sm">
                      Transfer to your PayPal account
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8">
                {/* Amount Input */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Withdrawal Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-semibold">
                      ₱
                    </span>
                    <input
                      type="number"
                      id="amount"
                      placeholder="500 minimum"
                      min="500"
                      value={cashoutAmount}
                      onChange={(e) => setCashoutAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="flex gap-3 mt-4">
                    {[500, 1000, 10000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashoutAmount(amt)}
                        className="flex-1 px-4 py-3 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-green-50 hover:to-emerald-50 border-2 border-gray-200 hover:border-green-300 text-gray-700 hover:text-green-700 font-semibold rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                        ₱{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email Input */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    PayPal Email Address
                  </label>
                  <input
                    type="email"
                    id="paypalEmail"
                    placeholder="yourname@example.com"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-4 text-gray-700 font-semibold border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCashOut}
                    disabled={loading}
                    className={`flex-1 px-6 py-4 rounded-xl text-white font-semibold transition-all duration-200 ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:scale-105 active:scale-95 shadow-lg"
                    }`}
                  >
                    {loading ? "Processing..." : "Confirm Withdrawal"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Earnings;
