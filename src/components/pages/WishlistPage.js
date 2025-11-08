import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "./homepage-comp/Navbar";
import Footer from "./homepage-comp/Footer";

const WishlistPage = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [wishText, setWishText] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        alert("You must be logged in to access the Wishlist page.");
        navigate("/login");
      } else {
        setUser(currentUser);

        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setUserData(userSnap.data());
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleTextChange = (e) => {
    const text = e.target.value;
    setWishText(text);
    setCharCount(text.length);
  };

  const handleSubmit = async () => {
    if (!wishText.trim()) {
      alert("Please enter your wish or recommendation first!");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "wishlist"), {
        userId: user?.uid || "guest",
        name: userData?.name || "Guest",
        wish: wishText.trim(),
        createdAt: serverTimestamp(),
      });

      setWishText("");
      setCharCount(0);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (error) {
      console.error("Error saving wish:", error);
      alert("Something went wrong while sending your wish.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-beige via-[#f5e6d3] to-beige">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#3d4f3a]/30 border-t-[#3d4f3a] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-beige via-[#f5e6d3] to-[#e8d5b7] flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
        {/* Floating decoration elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#3d4f3a]/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-[#8b7355]/10 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-[#dcd0b5]/20 rounded-full blur-2xl animate-pulse"></div>

        {/* Main Card */}
        <div className="relative z-10 animate-slideUp">
          {/* Header Section */}
          <div className="text-center mt-8  mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#3d4f3a] to-[#4a5d47] rounded-full shadow-xl mb-4 animate-bounce-slow">
              <svg className="w-10 h-10 text-[#f5e6d3]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#3d4f3a] mb-3 tracking-tight">
              Make a Wish ✨
            </h1>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              Share your thoughts, ideas, or suggestions to help us create something magical
            </p>
          </div>

          {/* Card Container */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-2xl border border-[#dcd0b5]/50 relative overflow-hidden">
            {/* Decorative corner elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#3d4f3a]/5 to-transparent rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#8b7355]/5 to-transparent rounded-tr-full"></div>

            <div className="relative z-10">
              {/* User Info */}
              <div className="flex items-center gap-3 mb-6 p-4 bg-gradient-to-r from-[#3d4f3a]/10 to-transparent rounded-2xl border border-[#3d4f3a]/20">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3d4f3a] to-[#4a5d47] flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {userData?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="font-semibold text-[#3d4f3a]">
                    {userData?.name || "Guest"}
                  </p>
                  <p className="text-sm text-gray-500">Sharing a wish</p>
                </div>
              </div>

              {/* Textarea */}
              <div className="relative mb-6">
                <label className="block text-sm font-bold text-[#3d4f3a] mb-3">
                  Your Wish or Suggestion
                </label>
                <textarea
                  value={wishText}
                  onChange={handleTextChange}
                  placeholder="I wish KuboHub could..."
                  className="w-full h-40 p-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#3d4f3a]/20 focus:border-[#3d4f3a] focus:outline-none text-gray-700 resize-none transition-all duration-200 bg-white hover:border-gray-300 shadow-sm"
                  maxLength={500}
                />
                <div className="absolute bottom-4 right-4 text-xs text-gray-400 font-medium">
                  {charCount}/500
                </div>
              </div>

              {/* Suggestion Pills */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-600 mb-3">
                  Need inspiration? Try these:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "New features",
                    "Better search",
                    "Mobile app",
                    "User experience",
                    "Pricing options",
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        setWishText(
                          (prev) =>
                            prev + (prev ? " " : "") + `I wish for ${suggestion.toLowerCase()}`
                        )
                      }
                      className="px-4 py-2 bg-[#3d4f3a]/10 hover:bg-[#3d4f3a]/20 text-[#3d4f3a] text-sm font-medium rounded-full transition-all duration-200 hover:scale-105 border border-[#3d4f3a]/20"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading || !wishText.trim()}
                className="relative bg-gradient-to-r from-[#3d4f3a] to-[#4a5d47] text-[#f5e6d3] font-bold px-8 py-4 rounded-2xl w-full hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100 overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending your wish...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                      Send My Wish
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              </button>

              {/* Success Message */}
              {success && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl animate-slideDown">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-green-800 font-bold">
                        Your wish has been sent! 🌿
                      </p>
                      <p className="text-green-600 text-sm">
                        Thank you for helping us improve KuboHub
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-2xl">
            {[
              {
                icon: "💡",
                title: "Share Ideas",
                desc: "Tell us what features you'd love to see",
              },
              {
                icon: "🎯",
                title: "Report Issues",
                desc: "Help us fix bugs and improve performance",
              },
              {
                icon: "✨",
                title: "Give Feedback",
                desc: "Let us know how we can serve you better",
              },
            ].map((item, index) => (
              <div
                key={index}
                style={{ animationDelay: `${index * 150}ms` }}
                className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-[#dcd0b5]/30 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fadeIn text-center"
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold text-[#3d4f3a] mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />

      <style jsx>{`
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

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

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

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-30px);
          }
        }

        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-slideDown {
          animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default WishlistPage;