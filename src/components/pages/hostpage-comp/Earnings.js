import React, { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
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
import { addDoc, serverTimestamp } from "firebase/firestore";

const Earnings = () => {
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [cashoutAmount, setCashoutAmount] = useState("");

  const [cashouts, setCashouts] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");

  const openPromoModal = () => setPromoModalOpen(true);
  const closePromoModal = () => setPromoModalOpen(false);

  const [validCodes, setValidCodes] = useState([]);

  const [redeemHistory, setRedeemHistory] = useState([]);
const [redeemLoading, setRedeemLoading] = useState(true);


  useEffect(() => {
    const fetchRewardCodes = async () => {
      try {
        const q = query(
          collection(db, "rewards"),
          where("type", "==", "ewallet-credit")
        );
        const snap = await getDocs(q);

        const codes = snap.docs.flatMap((docSnap) => {
          const data = docSnap.data();
          return (data.codes || [])
            .filter((c) => !c.used) // only unused codes
            .map((c) => ({
              ...c,
              code: c.code.toLowerCase(),
              money: data.money, // attach parent discount
              rewardId: docSnap.id,
            }));
        });

        setValidCodes(codes);
      } catch (error) {
        console.error(error);
      }
    };

    fetchRewardCodes();
  }, []);

  const markCodeAsUsed = async (matchedCodeObj) => {
    if (!matchedCodeObj) return;

    try {
      const docRef = doc(db, "rewards", matchedCodeObj.rewardId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return;

      const data = docSnap.data();

      // Find the code in the codes array
      const codeIndex = data.codes.findIndex(
        (c) => c.code.toLowerCase() === matchedCodeObj.code
      );

      if (codeIndex === -1) return;

      const updatedCodes = [...data.codes];
      updatedCodes[codeIndex] = {
        ...updatedCodes[codeIndex],
        used: true,
      };

      await updateDoc(docRef, { codes: updatedCodes });

      // Update local validCodes state to remove the used code
      setValidCodes((prev) =>
        prev.filter((c) => c.code.toLowerCase() !== matchedCodeObj.code)
      );

      console.log("Promo code marked as used.");
    } catch (error) {
      console.error("Failed to mark promo code as used:", error);
    }
  };

  const handlePromoSubmit = async () => {
    const input = promoCode.trim().toLowerCase();

    const matchedCodeObj = validCodes.find((c) => c.code === input);

    if (!matchedCodeObj) {
      alert("Invalid or already used reward code.");
      return closePromoModal();
    }

    // ✅ Success
    try {
      const hostRef = doc(db, "users", auth.currentUser.uid);
      const hostSnap = await getDoc(hostRef);

      if (hostSnap.exists()) {
        const hostData = hostSnap.data();
        const currentEwallet = hostData.ewallet || 0;

        await updateDoc(hostRef, {
          ewallet: currentEwallet + matchedCodeObj.money,
        });
        await addDoc(collection(db, "redeem_history"), {
  hostId: auth.currentUser.uid,
  rewardId: matchedCodeObj.rewardId,
  code: matchedCodeObj.code,
  amount: matchedCodeObj.money,
  timestamp: serverTimestamp(),
});

        markCodeAsUsed(matchedCodeObj);
      }

      // ✅ Add to redeem history
      

      alert("Congratulations! You get ₱" + matchedCodeObj.money);
    } catch (error) {
      console.error("Error updating eWallet:", error);
      alert("Something went wrong.");
    }

    closePromoModal();
  };

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

  const fetchRedeemHistory = useCallback(async () => {
  if (!auth.currentUser) return;
  setRedeemLoading(true);
  try {
    const redeemRef = collection(db, "redeem_history");
    const q = query(redeemRef, where("hostId", "==", auth.currentUser.uid));
    const snapshot = await getDocs(q);

    const list = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // Sort by most recent
    list.sort((a, b) => {
      const dateA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
      const dateB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
      return dateB - dateA;
    });

    setRedeemHistory(list);
  } catch (err) {
    console.error("Error fetching redeem history:", err);
  } finally {
    setRedeemLoading(false);
  }
}, []);


  useEffect(() => {
    fetchTotalEarnings();
    fetchWalletBalance();
    fetchCashoutHistory();
    fetchRedeemHistory();
  }, [fetchTotalEarnings, fetchWalletBalance, fetchCashoutHistory, fetchRedeemHistory]);

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

  const formatDate = (date) => {
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-3.5 h-3.5" />;
      case "Approved":
        return <CheckCircle className="w-3.5 h-3.5" />;
      case "Rejected":
        return <XCircle className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white rounded-none md:rounded-3xl p-4 md:p-8">
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
        <div className="mb-12 flex justify-center gap-4">
          <button
            onClick={handleCashOutClick}
            disabled={loading}
            className={`group relative px-10 py-4 rounded-2xl text-white text-lg font-semibold shadow-xl transition-all duration-300 overflow-hidden ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-olive hover:shadow-2xl hover:scale-105 active:scale-95"
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

          {/* Promo Code Button */}
          <button
            onClick={openPromoModal}
            className="px-10 py-4 rounded-2xl bg-olive text-white text-lg font-semibold shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Enter Claim Code
          </button>
        </div>

        {promoModalOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={closePromoModal}
          >
            <div
              className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative overflow-hidden animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative background elements */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-olive/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-olive/5 rounded-full blur-3xl"></div>

              {/* Content wrapper */}
              <div className="relative z-10">
                {/* Header with close button */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-olive to-olive/80 rounded-2xl flex items-center justify-center shadow-lg animate-bounce-subtle">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 animate-slideInLeft">
                        Claim Code
                      </h2>
                      <p
                        className="text-sm text-gray-500 animate-slideInLeft"
                        style={{ animationDelay: "0.1s" }}
                      >
                        Additional credit on your ewallet
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={closePromoModal}
                    className="text-gray-400 hover:text-gray-600 hover:rotate-90 transition-all duration-300 p-2 hover:bg-gray-100 rounded-full"
                    aria-label="Close modal"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Description with icon */}
                <div className="bg-olive/5 border border-olive/20 rounded-2xl p-4 mb-6 animate-slideInRight">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-0.5 text-olive flex-shrink-0">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Enter your claim code below to receive special
                      credits for your ewallet.
                    </p>
                  </div>
                </div>

                {/* Input field with icon */}
                <div className="relative mb-6 animate-slideInUp">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="SAVE2024"
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-olive/20 focus:border-olive focus:outline-none text-gray-700 transition-all placeholder:text-gray-400 font-medium text-lg tracking-wide hover:border-gray-300"
                  />
                </div>

                {/* Action buttons */}
                <div
                  className="flex flex-col-reverse sm:flex-row justify-end gap-3 animate-slideInUp"
                  style={{ animationDelay: "0.1s" }}
                >
                  <button
                    onClick={closePromoModal}
                    className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handlePromoSubmit}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-olive to-olive/90 text-white rounded-2xl hover:shadow-xl transition-all font-semibold hover:scale-[1.02] active:scale-[0.98] hover:from-olive/90 hover:to-olive flex items-center justify-center gap-2 group"
                  >
                    <span>Apply Code</span>
                    <svg
                      className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cashout History */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="p-2 bg-[#c8d3ad] rounded-xl">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-olive-darker" />
            </div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              Withdrawal History
            </h2>
          </div>

          {/* Loading State */}
          {historyLoading ? (
            <div className="text-center py-12 sm:py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-olive mx-auto"></div>
              <p className="text-gray-500 mt-4 text-sm sm:text-base">
                Loading history...
              </p>
            </div>
          ) : cashouts.length === 0 ? (
            // Empty State
            <div className="text-center py-12 sm:py-16">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 text-base sm:text-lg font-medium">
                No withdrawals yet
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Your withdrawal history will appear here
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View (hidden on md and up) */}
              <div className="space-y-3 md:hidden">
                {cashouts.map((c) => (
                  <div
                    key={c.id}
                    className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 shadow-sm active:shadow-md transition-shadow"
                  >
                    {/* Top Row: ID and Status */}
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <span className="font-mono text-xs font-semibold text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg">
                        {c.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(
                          c.status
                        )}`}
                      >
                        {getStatusIcon(c.status)}
                        {c.status}
                      </span>
                    </div>

                    {/* Amount - Large and prominent */}
                    <div className="mb-3">
                      <div className="text-2xl font-bold text-gray-900">
                        ₱{c.amount.toLocaleString()}
                      </div>
                    </div>

                    {/* Email and Date */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 font-medium min-w-[60px]">
                          Email:
                        </span>
                        <span className="text-gray-700 break-all">
                          {c.paypalEmail}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-medium min-w-[60px]">
                          Date:
                        </span>
                        <span className="text-gray-600">
                          {formatDate(c.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (hidden on mobile) */}
              <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
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
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {cashouts.map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="py-4 px-6">
                            <span className="font-mono text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg inline-block">
                              {c.id}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-gray-700 text-sm">
                            {c.paypalEmail}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="font-bold text-lg text-gray-900">
                              ₱{c.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(
                                c.status
                              )}`}
                            >
                              {getStatusIcon(c.status)}
                              {c.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center text-sm text-gray-600 whitespace-nowrap">
                            {formatDate(c.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
        {/* Redeem Code History */}
<div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100 mt-10">
  {/* Header */}
  <div className="flex items-center gap-3 mb-4 sm:mb-6">
    <div className="p-2 bg-[#c8d3ad] rounded-xl">
      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-olive-darker" />
    </div>
    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
      Redeem Code History
    </h2>
  </div>

  {/* Loading State */}
  {redeemLoading ? (
    <div className="text-center py-12 sm:py-16">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-olive mx-auto"></div>
      <p className="text-gray-500 mt-4 text-sm sm:text-base">Loading history...</p>
    </div>
  ) : redeemHistory.length === 0 ? (
    // Empty State
    <div className="text-center py-12 sm:py-16">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
      </div>
      <p className="text-gray-500 text-base sm:text-lg font-medium">
        No promo codes redeemed yet
      </p>
      <p className="text-gray-400 text-sm mt-1">
        Your redeem history will appear here
      </p>
    </div>
  ) : (
    <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gradient-to-r from-olive to-olive-darker">
            <tr>
              <th className="py-4 px-6 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Code
              </th>
              <th className="py-4 px-6 text-center text-xs font-semibold text-white uppercase tracking-wider">
                Amount
              </th>
              <th className="py-4 px-6 text-center text-xs font-semibold text-white uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {redeemHistory.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="py-4 px-6 font-mono text-sm font-semibold text-gray-900">
                  {r.code}
                </td>
                <td className="py-4 px-6 text-center font-bold text-lg text-gray-900">
                  ₱{r.amount.toLocaleString()}
                </td>
                <td className="py-4 px-6 text-center text-sm text-gray-600 whitespace-nowrap">
                  {r.timestamp?.toDate
                    ? r.timestamp.toDate().toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : ""}
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
