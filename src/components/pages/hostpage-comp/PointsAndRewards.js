import React, { useState, useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../../firebaseConfig"; // adjust path if needed


const PointsAndRewards = () => {
  const [points, setPoints] = useState(1500); // Demo points
  const [tierInfo, setTierInfo] = useState({});
  const [progressPercent, setProgressPercent] = useState(0);
  const [selectedTier, setSelectedTier] = useState(null);
  const [loading, setLoading] = useState(true)

  //static tier rewards
  const tierRewards = {
    "Bronze": [
      { title: "Welcome Bonus", cost: 0, desc: "₱50 welcome voucher for new hosts", icon: "🎁", color: "from-amber-500 to-orange-500" },
      { title: "Basic Support", cost: 50, desc: "Access to email support within 48 hours", icon: "📧", color: "from-blue-400 to-blue-500" },
    ],
    "Silver": [
      { title: "₱100 Voucher", cost: 200, desc: "Redeem for a ₱100 store voucher", icon: "🎫", color: "from-purple-500 to-pink-500" },
      { title: "Priority Listing", cost: 250, desc: "Featured placement for 7 days", icon: "⭐", color: "from-yellow-400 to-yellow-500" },
      { title: "Profile Badge", cost: 300, desc: "Silver host badge on your profile", icon: "🥈", color: "from-gray-400 to-gray-500" },
    ],
    "Gold": [
      { title: "₱250 Voucher", cost: 500, desc: "Redeem for a ₱250 store voucher", icon: "🎫", color: "from-purple-500 to-pink-500" },
      { title: "Premium Support", cost: 600, desc: "Priority support with 12-hour response", icon: "💬", color: "from-green-400 to-green-500" },
      { title: "Analytics Dashboard", cost: 700, desc: "Advanced insights and booking analytics", icon: "📊", color: "from-blue-500 to-cyan-500" },
      { title: "Gold Badge", cost: 750, desc: "Exclusive gold host badge", icon: "👑", color: "from-yellow-500 to-yellow-600" },
    ],
    "Platinum": [
      { title: "₱500 Voucher", cost: 1000, desc: "Redeem for a ₱500 store voucher", icon: "🎫", color: "from-purple-500 to-pink-500" },
      { title: "Free Photoshoot", cost: 1200, desc: "Professional property photography session", icon: "📸", color: "from-pink-400 to-rose-500" },
      { title: "VIP Support", cost: 1300, desc: "Dedicated account manager & 24/7 support", icon: "👨‍💼", color: "from-indigo-500 to-purple-500" },
      { title: "Featured Host", cost: 1500, desc: "Homepage featured host for 30 days", icon: "🌟", color: "from-yellow-400 to-orange-400" },
    ],
    "Diamond": [
      { title: "₱1000 Voucher", cost: 2000, desc: "Redeem for a ₱1000 store voucher", icon: "🎫", color: "from-purple-500 to-pink-500" },
      { title: "Marketing Package", cost: 2500, desc: "Social media promotion & ad credits", icon: "📱", color: "from-blue-500 to-cyan-500" },
      { title: "Diamond Concierge", cost: 2800, desc: "Personal concierge service for bookings", icon: "💎", color: "from-cyan-400 to-blue-500" },
      { title: "Annual Conference", cost: 3000, desc: "Free ticket to Hiraya Host Summit", icon: "🎤", color: "from-orange-400 to-red-500" },
      { title: "Revenue Boost", cost: 3500, desc: "Guaranteed top placement for 90 days", icon: "🚀", color: "from-green-400 to-emerald-500" },
    ],
    "Hiraya Host": [
      { title: "₱2000 Voucher", cost: 4000, desc: "Redeem for a ₱2000 premium voucher", icon: "🎫", color: "from-purple-500 to-pink-500" },
      { title: "Lifetime Premium", cost: 5000, desc: "Lifetime premium account features", icon: "♾️", color: "from-emerald-500 to-teal-500" },
      { title: "Partner Program", cost: 6000, desc: "Exclusive partnership opportunities", icon: "🤝", color: "from-blue-500 to-indigo-500" },
      { title: "Custom Branding", cost: 7000, desc: "Personalized host page with your branding", icon: "🎨", color: "from-pink-500 to-rose-500" },
      { title: "Global Showcase", cost: 8000, desc: "Featured in international marketing", icon: "🌍", color: "from-green-500 to-emerald-600" },
      { title: "Elite Retreat", cost: 10000, desc: "All-expenses paid retreat for top hosts", icon: "✨", color: "from-yellow-400 to-amber-500" },
    ],
  };    

  const getNextTierInfo = (points) => {
    if (points < 200)
      return { current: "Bronze", next: "Silver", required: 200 };
    if (points < 500) return { current: "Silver", next: "Gold", required: 500 };
    if (points < 1000)
      return { current: "Gold", next: "Platinum", required: 1000 };
    if (points < 2000)
      return { current: "Platinum", next: "Diamond", required: 2000 };
    if (points < 4000)
      return { current: "Diamond", next: "Hiraya Host", required: 4000 };
    return { current: "Hiraya Host", next: "Maxed", required: 4000 };
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case "Bronze":
        return "bg-amber-600";
      case "Silver":
        return "bg-gray-400";
      case "Gold":
        return "bg-yellow-500";
      case "Platinum":
        return "bg-blue-400";
      case "Diamond":
        return "bg-cyan-400";
      case "Hiraya Host":
        return "bg-emerald-500";
      default:
        return "bg-amber-600";
    }
  };

  useEffect(() => {
    const fetchPointsAndTier = async (uid) => {
      try {
        const docRef = doc(db, "hostPoints", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const userPoints = data.points || 0;

          setPoints(userPoints);
          setTierInfo(getNextTierInfo(userPoints));

          const info = getNextTierInfo(userPoints);
          const progress =
            info.next === "Maxed"
              ? 100
              : Math.min((userPoints / info.required) * 100, 100);
          setProgressPercent(progress);
        }
      } catch (error) {
        console.error("Error fetching points:", error);
      } finally {
        setLoading(false);
      }
    };

    // Wait for authentication
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchPointsAndTier(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Loading points and rewards...</p>
      </div>
    );
  }


  const tiers = [
    { name: "Bronze", pts: 0, icon: "🥉", color: "from-amber-600 to-amber-800" },
    { name: "Silver", pts: 200, icon: "🥈", color: "from-gray-300 to-gray-400" },
    { name: "Gold", pts: 500, icon: "👑", color: "from-yellow-400 to-yellow-600" },
    { name: "Platinum", pts: 1000, icon: "⭐", color: "from-gray-400 to-gray-500" },
    { name: "Diamond", pts: 2000, icon: "💎", color: "from-cyan-400 to-blue-500" },
    { name: "Hiraya Host", pts: 4000, icon: "✨", color: "from-emerald-500 via-green-400 to-teal-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-olive-50 via-white to-emerald-50/30 flex flex-col items-center px-6 py-10">
      {/* Header */}
      <div className="text-center mb-12 animate-fadeIn">
        <h1 className="text-4xl md:text-5xl font-bold text-olive-dark mb-3 tracking-tight">
          Points & Rewards
        </h1>
        <p className="text-gray-600">Track your progress and unlock exclusive benefits</p>
      </div>

      {/* Main Card */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-2xl border border-white/60 backdrop-blur-sm mb-12 animate-slideUp">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Your Current Status
          </p>
          <div className="inline-flex items-center gap-3 mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-xl ${
              tierInfo.current === "Hiraya Host"
                ? "bg-gradient-to-r from-emerald-500 via-green-400 to-teal-500 animate-pulse"
                : getTierColor(tierInfo.current)
            }`}>
              {tierInfo.current === "Hiraya Host" ? "✨" : 
               tierInfo.current === "Diamond" ? "💎" :
               tierInfo.current === "Platinum" ? "⭐" :
               tierInfo.current === "Gold" ? "👑" :
               tierInfo.current === "Silver" ? "🥈" : "🥉"}
            </div>
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${
            tierInfo.current === "Hiraya Host"
              ? "bg-gradient-to-r from-emerald-600 via-green-500 to-teal-600 bg-clip-text text-transparent"
              : "text-gray-800"
          }`}>
            {tierInfo.current || "Bronze"} {tierInfo.current === "Hiraya Host" ? "" : "Tier"}
          </h2>
          
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-olive-dark/10 to-olive-dark/5 rounded-full border border-olive-dark/20 mt-4">
            <svg className="w-5 h-5 text-olive-dark" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-2xl font-bold text-olive-dark">{points}</span>
            <span className="text-sm font-medium text-gray-600">points</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-600">Progress to Next Tier</p>
              <p className="text-lg font-bold text-olive-dark mt-1">
                {tierInfo.next === "Maxed" ? (
                  <span className="flex items-center gap-2">
                    <span>🎉</span>
                    <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Maximum Level Reached!
                    </span>
                  </span>
                ) : (
                  `${tierInfo.next}`
                )}
              </p>
            </div>
            {tierInfo.next !== "Maxed" && (
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{tierInfo.required - points}</p>
                <p className="text-xs text-gray-500">points needed</p>
              </div>
            )}
          </div>

          <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${
                tierInfo.current === "Hiraya Host"
                  ? "bg-gradient-to-r from-emerald-500 via-green-400 to-teal-500"
                  : getTierColor(tierInfo.current)
              } shadow-lg`}
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer"></div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-3 text-center">
            {tierInfo.next === "Maxed"
              ? "🌟 You're at the pinnacle of excellence!"
              : `${progressPercent.toFixed(1)}% complete - Keep going!`}
          </p>
        </div>
      </div>

      {/* Tiers Overview - Now Clickable */}
      <div className="w-full max-w-6xl mb-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Tier Journey</h3>
          <p className="text-sm text-gray-500">Click to view tier rewards</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {tiers.map((tier, index) => {
            const isUnlocked = points >= tier.pts;
            const isCurrent = tierInfo.current === tier.name;
            const isSelected = selectedTier === tier.name;
            return (
              <button
                key={tier.name}
                onClick={() => setSelectedTier(tier.name)}
                style={{ animationDelay: `${index * 100}ms` }}
                className={`relative flex flex-col items-center p-5 rounded-2xl shadow-lg transition-all duration-300 animate-fadeIn cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-br from-olive-dark/20 to-olive-dark/10 border-2 border-olive-dark scale-105 shadow-2xl ring-4 ring-olive-dark/20"
                    : isCurrent
                    ? "bg-gradient-to-br from-white to-olive-50 border-2 border-olive-dark/50 hover:scale-105"
                    : isUnlocked
                    ? "bg-white border border-gray-200 hover:shadow-xl hover:scale-105"
                    : "bg-gray-50 border border-gray-200 opacity-60 cursor-not-allowed"
                }`}
                disabled={!isUnlocked}
              >
                {isCurrent && (
                  <div className="absolute -top-2 -right-2 bg-olive-dark text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                    Current
                  </div>
                )}
                {isSelected && (
                  <div className="absolute -top-2 -left-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md animate-pulse">
                    Viewing
                  </div>
                )}
                <div
                  className={`w-14 h-14 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center text-2xl shadow-lg mb-3 ${
                    tier.name === "Hiraya Host" && isSelected ? "animate-pulse" : ""
                  }`}
                >
                  {tier.icon}
                </div>
                <p className="font-bold text-gray-800 text-center text-sm mb-1">{tier.name}</p>
                <p className="text-xs text-gray-500 font-medium">{tier.pts} pts</p>
                {isUnlocked && !isCurrent && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Rewards Section Based on Selected Tier */}
      <div className="w-full max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              {selectedTier} Tier Rewards
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {points >= tiers.find(t => t.name === selectedTier)?.pts
                ? "Exclusive rewards available at this tier"
                : `Unlock ${selectedTier} tier to access these rewards`}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tierRewards[selectedTier]?.map((reward, index) => {
            const canRedeem = points >= reward.cost;
            const tierUnlocked = points >= tiers.find(t => t.name === selectedTier)?.pts;
            return (
              <div
                key={reward.title}
                style={{ animationDelay: `${index * 100}ms` }}
                className={`relative bg-white border rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 animate-fadeIn ${
                  canRedeem && tierUnlocked ? "border-olive-dark/30" : "border-gray-200"
                }`}
              >
                {!tierUnlocked && (
                  <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                    <div className="text-center text-white">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <p className="font-bold">Locked</p>
                      <p className="text-xs mt-1">Reach {selectedTier} tier</p>
                    </div>
                  </div>
                )}
                {canRedeem && tierUnlocked && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce">
                    Available!
                  </div>
                )}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${reward.color} flex items-center justify-center text-3xl shadow-lg mb-4`}>
                  {reward.icon}
                </div>
                <h4 className="font-bold text-gray-800 text-lg mb-2">
                  {reward.title}
                </h4>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{reward.desc}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-olive-dark" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-bold text-gray-700">{reward.cost} pts</span>
                  </div>
                  <button
                    disabled={!canRedeem || !tierUnlocked}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                      canRedeem && tierUnlocked
                        ? "bg-gradient-to-r from-olive-dark to-olive-dark/90 text-white hover:shadow-lg hover:scale-105"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {!tierUnlocked ? "Locked" : canRedeem ? "Redeem Now" : "Not Enough"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-slideUp {
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PointsAndRewards;