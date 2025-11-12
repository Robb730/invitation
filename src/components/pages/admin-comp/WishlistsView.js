import React, { useEffect, useState } from "react";
import { db } from "../../../firebaseConfig";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import { Heart, Check, Eye, Sparkles, Search, Filter } from 'lucide-react';

const WishlistsView = () => {
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // ✅ new filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const stats = {
    total: wishes.length,
    unread: wishes.filter(w => !w.read).length,
    liked: wishes.filter(w => w.liked).length,
    read: wishes.filter(w => w.read).length
  }

  

  // Fetch all wishes
  useEffect(() => {
    const fetchWishes = async () => {
      try {
        const q = query(collection(db, "wishlist"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const wishData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setWishes(wishData);
      } catch (error) {
        console.error("Error fetching wishes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWishes();
  }, []);

  // Mark wish as read
  const handleMarkRead = async (wishId) => {
    try {
      const wishRef = doc(db, "wishlist", wishId);
      await updateDoc(wishRef, { read: true });
      setWishes((prev) =>
        prev.map((w) => (w.id === wishId ? { ...w, read: true } : w))
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Mark wish as liked
  const handleLikeWish = async (wishId, liked) => {
    try {
      const wishRef = doc(db, "wishlist", wishId);
      await updateDoc(wishRef, { liked: !liked });
      setWishes((prev) =>
        prev.map((w) => (w.id === wishId ? { ...w, liked: !liked } : w))
      );
    } catch (error) {
      console.error("Error liking wish:", error);
    }
  };

  

  // Filter logic
  const filteredWishes = wishes.filter((w) => {
    const matchesFilter = 
      filter === "all" ? true :
      filter === "unread" ? !w.read :
      filter === "read" ? w.read :
      filter === "liked" ? w.liked : true;

    const matchesSearch = 
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.wish.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-beige via-[#f5e6d3] to-beige">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#3d4f3a]/30 border-t-[#3d4f3a] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">Loading wishes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Wishes Dashboard
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">Manage user feedback and suggestions</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Total", value: stats.total, color: "from-blue-500 to-blue-600", icon: "📊" },
              { label: "Unread", value: stats.unread, color: "from-amber-500 to-orange-600", icon: "🔔" },
              { label: "Read", value: stats.read, color: "from-green-500 to-emerald-600", icon: "✓" },
              { label: "Liked", value: stats.liked, color: "from-pink-500 to-rose-600", icon: "❤️" }
            ].map((stat, idx) => (
              <div 
                key={stat.label}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-xl shadow-lg`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search wishes or names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                showFilters 
                  ? "bg-slate-900 text-white shadow-lg" 
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Filter Buttons (collapsible) */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200">
              {[
                { id: "all", label: "All Wishes", emoji: "📋" },
                { id: "unread", label: "Unread", emoji: "🔔" },
                { id: "read", label: "Read", emoji: "✓" },
                { id: "liked", label: "Liked", emoji: "❤️" }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    filter === f.id
                      ? "bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg scale-105"
                      : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <span className="mr-1.5">{f.emoji}</span>
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Wishes List */}
        {filteredWishes.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200/50">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No wishes found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWishes.map((wish, idx) => (
              <div
                key={wish.id}
                className={`bg-white rounded-2xl p-6 shadow-sm border transition-all duration-300 hover:shadow-md group ${
                  wish.read
                    ? "border-green-200 bg-gradient-to-br from-white to-green-50/30"
                    : "border-slate-200 hover:border-blue-300"
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm ${
                      wish.userId === "guest" 
                        ? "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600" 
                        : "bg-gradient-to-br from-blue-500 to-purple-500 text-white"
                    }`}>
                      {wish.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-lg">
                        {wish.name}
                      </h2>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        {wish.userId === "guest" ? (
                          <>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                            Guest user
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            {wish.userId}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkRead(wish.id)}
                      disabled={wish.read}
                      className={`px-4 py-2 text-sm rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                        wish.read
                          ? "bg-green-100 text-green-700 cursor-default shadow-inner"
                          : "bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow-md active:scale-95"
                      }`}
                    >
                      {wish.read ? (
                        <>
                          <Check className="w-4 h-4" />
                          Read
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Mark Read
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleLikeWish(wish.id, wish.liked)}
                      disabled={!wish.read}
                      className={`px-4 py-2 text-sm rounded-xl font-medium border transition-all duration-200 flex items-center gap-2 ${
                        !wish.read
                          ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                          : wish.liked
                          ? "bg-gradient-to-r from-pink-500 to-rose-500 border-pink-500 text-white shadow-lg shadow-pink-500/30 hover:shadow-xl active:scale-95"
                          : "bg-white border-slate-200 text-slate-700 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600 shadow-sm active:scale-95"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${wish.liked ? "fill-current" : ""}`} />
                      {wish.liked ? "Liked" : "Like"}
                    </button>
                  </div>
                </div>

                {/* Wish Content */}
                <div className="bg-slate-50/50 rounded-xl p-4 mb-3 border border-slate-100">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {wish.wish}
                  </p>
                </div>

                {/* Timestamp */}
                
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .group:hover .group-hover:scale-105 {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
};

export default WishlistsView;
