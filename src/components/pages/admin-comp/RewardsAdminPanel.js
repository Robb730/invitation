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

const tiers = ["bronze", "silver", "gold", "platinum", "diamond", "hiraya"];

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
    hiraya: "✨",
  };

  const tierColors = {
    bronze: "from-amber-600 to-amber-800",
    silver: "from-gray-400 to-gray-600",
    gold: "from-yellow-400 to-yellow-600",
    platinum: "from-slate-300 to-slate-500",
    hiraya: "from-emerald-300 to-emerald-500",
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-olive to-olive-dark bg-clip-text text-transparent mb-4">
            Rewards Management
          </h1>
          <p className="text-gray-600">
            Create and manage tier-based rewards for your loyalty program
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden">
          {/* Tier Selector */}
          <div className="bg-gradient-to-r from-olive to-olive-dark p-6">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {tiers.map((tier) => {
                const Icon = tierIcons[tier];
                return (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                      selectedTier === tier
                        ? "bg-white text-olive-dark shadow-lg scale-105"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    <span className="text-xl">{Icon}</span>

                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-8">
            {/* Tier Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br ${tierColors[selectedTier]} shadow-lg`}
                >
                  <div className="text-2xl">{TierIcon}</div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {selectedTier.charAt(0).toUpperCase() +
                      selectedTier.slice(1)}{" "}
                    Tier
                  </h3>
                  <p className="text-sm text-gray-500">
                    {rewards.length} reward{rewards.length !== 1 ? "s" : ""}{" "}
                    available
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(true)}
                disabled={rewards.length >= 3}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  rewards.length >= 3
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-olive to-olive-dark text-white hover:shadow-lg hover:scale-105"
                }`}
              >
                <Plus className="w-5 h-5" />
                Add Reward
              </button>
            </div>

            {/* Rewards Grid */}
            {rewards.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-4">
                  <Gift className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">No rewards yet</p>
                <p className="text-gray-400 text-sm mt-2">
                  Create your first reward to get started
                </p>
              </div>
            ) : (
              <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2">
                {rewards.map((r, idx) => (
                  <div
                    key={r.id}
                    className="group relative p-6 border-2 border-gray-100 rounded-2xl bg-gradient-to-br from-white to-gray-50 hover:border-indigo-200 hover:shadow-xl transition-all duration-300"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-olive to-olive-darker shadow-md group-hover:scale-110 transition-transform duration-300">
                          <Gift className="w-6 h-6 text-white" />
                        </div>

                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg mb-2">
                            {r.title}
                          </h4>

                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                              {r.pointsRequired} points
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                              {getRewardTypeLabel(r.type)}
                            </span>
                            {r.discount && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                {r.discount}% OFF
                              </span>
                            )}
                            {r.money && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                ₱{r.money}
                              </span>
                            )}
                          </div>

                          {r.discountPercent && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span className="font-semibold text-green-600">
                                {r.discountPercent}% Discount
                              </span>
                            </div>
                          )}
                          {r.ewalletAmount && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span className="font-semibold text-blue-600">
                                ₱{r.ewalletAmount} Credit
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteReward(r.id)}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
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
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
          style={{
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(30px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            @keyframes slideInFromTop {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes sparkle {
              0%, 100% { opacity: 0.5; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.1); }
            }
            .modal-enter {
              animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .field-enter {
              animation: slideInFromTop 0.3s ease-out;
            }
            .sparkle-animation {
              animation: sparkle 2s ease-in-out infinite;
            }
          `}</style>
          
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden modal-enter relative">
            {/* Decorative gradient overlay */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-olive/10 via-olive-dark/10 to-olive-darker/10 pointer-events-none" />
            
            {/* Header */}
            <div className="relative p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-olive to-olive-dark rounded-xl shadow-lg sparkle-animation">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-olive via-olive-dark to-olive-darker bg-clip-text text-transparent">
                      Add New Reward
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 ml-14">
                    <div className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full">
                      <span className="text-sm font-semibold text-indigo-700">
                        {selectedTier.charAt(0).toUpperCase() +
                      selectedTier.slice(1)}{" "}
                    Tier
                      </span>
                    </div>
                    <Sparkles className="w-4 h-4 text-purple-500 sparkle-animation" />
                  </div>
                </div>
                
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-300 group"
                >
                  <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:rotate-90 transition-all duration-300" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Title Input */}
              <div className="field-enter">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  Reward Title
                </label>
                <input
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all duration-300 hover:border-gray-300"
                  placeholder="e.g., Reservation Discount"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Points Input */}
              <div className="field-enter" style={{ animationDelay: '0.05s' }}>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  Points Required
                </label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 hover:border-gray-300"
                    placeholder="e.g., 500"
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                    pts
                  </div>
                </div>
              </div>

              {/* Type Select */}
              <div className="field-enter" style={{ animationDelay: '0.1s' }}>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-pink-500 rounded-full" />
                  Reward Type
                </label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-4 focus:ring-pink-100 outline-none transition-all duration-300 bg-white hover:border-gray-300 appearance-none cursor-pointer"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="">Select a type...</option>
                    <option value="host-payment">Host Payment Coupon</option>
                    <option value="reservation-discount">Reservation Discount</option>
                    <option value="ewallet-credit">E-Wallet Credit</option>
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    {getTypeIcon()}
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Conditional Fields */}
              {(type === 'host-payment' || type === 'reservation-discount') && (
                <div className="field-enter bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-2xl border-2 border-indigo-100">
                  <label className="block text-sm font-semibold text-indigo-700 mb-2 flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    Discount Percentage
                  </label>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all duration-300 bg-white"
                      placeholder="e.g., 20"
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 text-sm font-bold">
                      %
                    </div>
                  </div>
                </div>
              )}

              {type === 'ewallet-credit' && (
                <div className="field-enter bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl border-2 border-green-100">
                  <label className="block text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    E-Wallet Amount
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 font-bold">
                      ₱
                    </div>
                    <input
                      className="w-full pl-10 pr-4 py-3 border-2 border-green-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all duration-300 bg-white"
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
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50/50">
              <button
                className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 hover:scale-105 transition-all duration-300 shadow-sm"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button
                className="px-6 py-3 bg-olive text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2 relative overflow-hidden group"
                onClick={handleAddReward}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-olive-dark to-olive-darker opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative">Add Reward</span>
                <Sparkles className="w-4 h-4 relative" />
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
