import React, { useEffect, useState, useCallback } from "react";
import { db } from "../../../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Plus, Gift, Trash2, Award, Sparkles, X, Percent, Wallet} from "lucide-react";
import { addReward } from "../../../utils/rewardsSystem";

const tiers = ["bronze", "silver", "gold", "platinum", "diamond", "hiraya host"];

const RewardsAdminPanel = () => {
  const [selectedTier, setSelectedTier] = useState("silver");
  const [rewards, setRewards] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState("");
  const [points, setPoints] = useState("");
  const [type, setType] = useState("");

  const getRewardTypeLabel = (type) => {
    const labels = {
      "host-payment": "Host Payment Coupon",
      "reservation-discount": "Reservation Discount",
      "ewallet-credit": "E-Wallet Credit",
    };
    return labels[type] || type;
  };

  const [discountPercent, setDiscountPercent] = useState("");
  const [ewalletAmount, setEwalletAmount] = useState("");

  const getTypeIcon = () => {
    switch (type) {
      case 'host-payment':
        return <Gift className="w-5 h-5" />;
      case 'reservation-discount':
        return <Percent className="w-5 h-5" />;
      case 'ewallet-credit':
        return <Wallet className="w-5 h-5" />;
      default:
        return <Award className="w-5 h-5" />;
    }
  };

  const tierIcons = {
    bronze: "🥉",
    silver: "🥈",
    gold: "👑",
    platinum: "⭐",
    diamond: "💎",
    "hiraya host": "✨",
  };

  const tierColors = {
    bronze: "from-amber-600 to-amber-800",
    silver: "from-gray-400 to-gray-600",
    gold: "from-yellow-400 to-yellow-600",
    platinum: "from-slate-300 to-slate-500",
    "hiraya host": "from-emerald-300 to-emerald-500",
  };

  const fetchRewards = useCallback(async () => {
    const q = query(
      collection(db, "rewards"),
      where("tier", "==", selectedTier)
    );
    const snap = await getDocs(q);
    setRewards(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, [selectedTier]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const handleAddReward = async () => {
    // Validate basic fields
    if (!title || !points || !type)
      return alert("Please fill all required fields.");

    // Validate type-specific fields
    if (
      (type === "host-payment" || type === "reservation-discount") &&
      !discountPercent
    ) {
      return alert("Please enter a discount percentage.");
    }
    if (type === "ewallet-credit" && !ewalletAmount) {
      return alert("Please enter an e-wallet amount.");
    }

    // Max rewards per tier
    if (rewards.length >= 3) {
      return alert("Maximum of 3 rewards allowed for this tier.");
    }

    // Prepare reward data
    const rewardData = {
      tier: selectedTier,
      title,
      pointsRequired: Number(points),
      type,
      createdAt: new Date(), // serverTimestamp() if using firestore server timestamp
      codes: [],
      active: true,
    };

    // Add type-specific fields
    if (type === "host-payment" || type === "reservation-discount") {
      rewardData.discountPercent = Number(discountPercent);
    } else if (type === "ewallet-credit") {
      rewardData.ewalletAmount = Number(ewalletAmount);
    }

    try {
      // Save to Firestore
      await addReward(rewardData);

      // Reset modal inputs
      setShowModal(false);
      setTitle("");
      setPoints("");
      setType("");
      setDiscountPercent("");
      setEwalletAmount("");

      // Refresh rewards list
      fetchRewards();
    } catch (error) {
      console.error("Failed to add reward:", error);
      alert("Error adding reward.");
    }
  };

  const handleDeleteReward = async (rewardId) => {
    if (!window.confirm("Are you sure you want to delete this reward?")) return;

    try {
      await deleteDoc(doc(db, "rewards", rewardId));
      fetchRewards();
    } catch (error) {
      console.error("Error deleting reward:", error);
      alert("Failed to delete reward.");
    }
  };

  const TierIcon = tierIcons[selectedTier];

  return (
    <div className="min-h-screen rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-3 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-olive to-olive-dark bg-clip-text text-transparent mb-2 sm:mb-4">
            Rewards Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Create and manage tier-based rewards
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl border border-white/50 overflow-hidden">
          {/* Tier Selector */}
          <div className="bg-gradient-to-r from-olive to-olive-dark p-3 sm:p-6">
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {tiers.map((tier) => {
                const Icon = tierIcons[tier];
                return (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 flex items-center gap-1 sm:gap-2 whitespace-nowrap text-sm sm:text-base ${
                      selectedTier === tier
                        ? "bg-white text-olive-dark shadow-lg scale-105"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    <span className="text-base sm:text-xl">{Icon}</span>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {/* Tier Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${tierColors[selectedTier]} shadow-lg`}>
                  <div className="text-xl sm:text-2xl">{TierIcon}</div>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                    {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Tier
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {rewards.length} reward{rewards.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(true)}
                disabled={rewards.length >= 3}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base ${
                  rewards.length >= 3
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-olive to-olive-dark text-white hover:shadow-lg hover:scale-105"
                }`}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Add Reward
              </button>
            </div>

            {/* Rewards Grid */}
            {rewards.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="inline-flex p-4 sm:p-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-4">
                  <Gift className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                </div>
                <p className="text-gray-500 text-base sm:text-lg">No rewards yet</p>
                <p className="text-gray-400 text-xs sm:text-sm mt-2">
                  Create your first reward to get started
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-2">
                {rewards.map((r, idx) => (
                  <div
                    key={r.id}
                    className="group relative p-4 sm:p-6 border-2 border-gray-100 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white to-gray-50 hover:border-indigo-200 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-olive to-olive-dark shadow-md group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                          <Gift className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-base sm:text-lg mb-2 break-words">
                            {r.title}
                          </h4>

                          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                              {r.pointsRequired} pts
                            </span>
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                              {getRewardTypeLabel(r.type)}
                            </span>
                            {r.discountPercent && (
                              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                {r.discountPercent}% OFF
                              </span>
                            )}
                            {r.ewalletAmount && (
                              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                ₱{r.ewalletAmount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteReward(r.id)}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="relative p-4 sm:p-6 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="p-1.5 sm:p-2 bg-gradient-to-br from-olive to-olive-dark rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                        <Award className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-olive to-olive-dark bg-clip-text text-transparent truncate">
                        Add New Reward
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 ml-0 sm:ml-14">
                      <div className="px-2 sm:px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full">
                        <span className="text-xs sm:text-sm font-semibold text-indigo-700">
                          {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Tier
                        </span>
                      </div>
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300 group flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
                {/* Title Input */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    Reward Title
                  </label>
                  <input
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all duration-300"
                    placeholder="e.g., Reservation Discount"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Points Input */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    Points Required
                  </label>
                  <div className="relative">
                    <input
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300"
                      placeholder="e.g., 500"
                      type="number"
                      value={points}
                      onChange={(e) => setPoints(e.target.value)}
                    />
                    <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm font-medium">
                      pts
                    </div>
                  </div>
                </div>

                {/* Type Select */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-pink-500 rounded-full" />
                    Reward Type
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 pl-9 sm:pl-11 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-4 focus:ring-pink-100 outline-none transition-all duration-300 bg-white appearance-none cursor-pointer"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="">Select a type...</option>
                      <option value="host-payment">Host Payment Coupon</option>
                      <option value="reservation-discount">Reservation Discount</option>
                      <option value="ewallet-credit">E-Wallet Credit</option>
                    </select>
                    <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      {getTypeIcon()}
                    </div>
                    <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Conditional Fields */}
                {(type === 'host-payment' || type === 'reservation-discount') && (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-indigo-100">
                    <label className="block text-xs sm:text-sm font-semibold text-indigo-700 mb-2 flex items-center gap-2">
                      <Percent className="w-3 h-3 sm:w-4 sm:h-4" />
                      Discount Percentage
                    </label>
                    <div className="relative">
                      <input
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all duration-300 bg-white"
                        placeholder="e.g., 20"
                        type="number"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(e.target.value)}
                      />
                      <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-indigo-400 text-xs sm:text-sm font-bold">
                        %
                      </div>
                    </div>
                  </div>
                )}

                {type === 'ewallet-credit' && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-green-100">
                    <label className="block text-xs sm:text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                      <Wallet className="w-3 h-3 sm:w-4 sm:h-4" />
                      E-Wallet Amount
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-green-600 font-bold text-sm sm:text-base">
                        ₱
                      </div>
                      <input
                        className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-green-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all duration-300 bg-white"
                        placeholder="e.g., 100"
                        type="number"
                        value={ewalletAmount}
                        onChange={(e) => setEwalletAmount(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                <button
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 shadow-sm text-sm sm:text-base"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-olive to-olive-dark text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
                  onClick={handleAddReward}
                >
                  <span>Add Reward</span>
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardsAdminPanel;
