import React, { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "./images/kubohublogo_beige.svg";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // 🟢 Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setUserData(userSnap.data());
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 🟢 Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🟢 Scroll handler
  const handleNavigateToSection = (sectionId) => {
    setMenuOpen(false); // close mobile menu if open
    if (location.pathname === "/") {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate("/", { state: { scrollTo: sectionId } });
    }
  };

  // 🟢 Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Logged out successfully!");
      navigate("/");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <nav className="bg-gradient-to-r from-olive-dark to-olive h-16 flex items-center px-6 sm:px-12 fixed top-0 w-full z-50 shadow-lg backdrop-blur-sm">
      {/* Left side: Logo and name */}
      <div className="flex items-center gap-x-3">
        <Link to="/" className="flex items-center gap-x-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-[#f5e6d3] rounded-full blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <img
              src={logo}
              alt="KuboHub Logo"
              className="relative h-10 w-10 sm:h-11 sm:w-11 object-cover ring-[#f5e6d3]/30 group-hover:ring-[#f5e6d3]/60 transition-all"
            />
          </div>
          <h1 className="text-[#f5e6d3] text-xl sm:text-2xl font-bold tracking-wide group-hover:text-white transition-colors">
            KuboHub
          </h1>
        </Link>
      </div>

      {/* Desktop menu */}
      <div className="hidden md:flex items-center ml-auto gap-x-2">
        <button
          onClick={() => handleNavigateToSection("homes-section")}
          className="font-medium text-[#f5e6d3]/90 px-4 py-2 rounded-lg hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          Homes
        </button>
        <button
          onClick={() => handleNavigateToSection("experiences-section")}
          className="font-medium text-[#f5e6d3]/90 px-4 py-2 rounded-lg hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          Experiences
        </button>
        <button
          onClick={() => handleNavigateToSection("services-section")}
          className="font-medium text-[#f5e6d3]/90 px-4 py-2 rounded-lg hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          Services
        </button>

        <div className="ml-4 flex items-center gap-x-3 pl-4 border-l border-[#f5e6d3]/20">
          <Link to="/becomehost">
            <button className="font-semibold bg-[#f5e6d3] text-[#3d4f3a] px-5 py-2 rounded-lg hover:bg-white hover:shadow-lg transform hover:scale-105 transition-all duration-200">
              Be a Host
            </button>
          </Link>

          {!user ? (
            <button
              onClick={() => navigate("/login")}
              className="font-semibold border-2 border-[#f5e6d3] text-[#f5e6d3] px-5 py-2 rounded-lg hover:bg-[#f5e6d3] hover:text-[#3d4f3a] transition-all duration-200"
            >
              Login
            </button>
          ) : (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="rounded-full w-10 h-10 overflow-hidden ring-2 ring-[#f5e6d3]/40 hover:ring-[#f5e6d3] transition-all transform hover:scale-110"
              >
                <img
                  src={
                    userData?.profilePic || "https://via.placeholder.com/150"
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-[slideDown_0.2s_ease-out] origin-top-right">
                  <div className="px-5 py-4 bg-gradient-to-br from-[#3d4f3a] via-[#4a5d47] to-[#3d4f3a] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50"></div>
                    <p className="font-bold text-[#f5e6d3] truncate text-base relative z-10 drop-shadow-sm">
                      {userData?.name || userData?.fullName}
                    </p>
                    <p className="text-[#f5e6d3]/70 text-xs mt-0.5 relative z-10">
                      Your Account
                    </p>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => navigate("/profile")}
                      className="group block w-full text-left px-5 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-[#3d4f3a]/5 hover:to-transparent hover:text-[#3d4f3a] transition-all flex items-center gap-3 font-medium"
                    >
                      <span className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#3d4f3a]/10 flex items-center justify-center transition-colors">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </span>
                      Profile Settings
                    </button>
                    <button
                      onClick={() => navigate("/reservations")}
                      className="group block w-full text-left px-5 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-[#3d4f3a]/5 hover:to-transparent hover:text-[#3d4f3a] transition-all flex items-center gap-3 font-medium"
                    >
                      <span className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#3d4f3a]/10 flex items-center justify-center transition-colors">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </span>
                      Reservations
                    </button>
                    <button
                      onClick={() => navigate("/favorites")}
                      className="group block w-full text-left px-5 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-[#3d4f3a]/5 hover:to-transparent hover:text-[#3d4f3a] transition-all flex items-center gap-3 font-medium"
                    >
                      <span className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#3d4f3a]/10 flex items-center justify-center transition-colors">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </span>
                      Favorites
                    </button>
                    <button
                      onClick={() => navigate("/wishlist")}
                      className="group block w-full text-left px-5 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-[#3d4f3a]/5 hover:to-transparent hover:text-[#3d4f3a] transition-all flex items-center gap-3 font-medium"
                    >
                      <span className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#3d4f3a]/10 flex items-center justify-center transition-colors">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      </span>
                      Wishlist
                    </button>
                  </div>
                  <div className="border-t border-gray-100 py-2">
                    <button
                      onClick={handleLogout}
                      className="group block w-full text-left px-5 py-3 text-red-600 hover:bg-red-50 transition-all flex items-center gap-3 font-medium"
                    >
                      <span className="w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                      </span>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile hamburger button */}
      <div className="ml-auto md:hidden">
        <button
          className="text-[#f5e6d3] focus:outline-none p-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="absolute top-16 left-0 w-full bg-gradient-to-b from-[#3d4f3a] to-[#4a5d47] flex flex-col items-center gap-y-2 py-6 shadow-2xl md:hidden z-50">
          <button
            onClick={() => handleNavigateToSection("homes-section")}
            className="text-[#f5e6d3] font-medium px-4 py-2.5 hover:bg-white/10 rounded-lg w-11/12 transition-all text-left"
          >
            Homes
          </button>
          <button
            onClick={() => handleNavigateToSection("experiences-section")}
            className="text-[#f5e6d3] font-medium px-4 py-2.5 hover:bg-white/10 rounded-lg w-11/12 transition-all text-left"
          >
            Experiences
          </button>
          <button
            onClick={() => handleNavigateToSection("services-section")}
            className="text-[#f5e6d3] font-medium px-4 py-2.5 hover:bg-white/10 rounded-lg w-11/12 transition-all text-left"
          >
            Services
          </button>

          <div className="w-11/12 h-px bg-[#f5e6d3]/20 my-2"></div>

          <Link to="/becomehost" className="w-11/12">
            <button className="font-semibold bg-[#f5e6d3] text-[#3d4f3a] px-5 py-2.5 rounded-lg w-full hover:bg-white hover:shadow-lg transition-all">
              Be a Host
            </button>
          </Link>

          {!user ? (
            <button
              onClick={() => navigate("/login")}
              className="font-semibold border-2 border-[#f5e6d3] text-[#f5e6d3] px-4 py-2.5 rounded-lg w-11/12 hover:bg-[#f5e6d3] hover:text-[#3d4f3a] transition-all"
            >
              Login
            </button>
          ) : (
            <div className="w-11/12 bg-white/95 backdrop-blur rounded-xl flex flex-col p-4 shadow-xl mt-2">
              <div className="flex items-center gap-x-3 mb-3 pb-3 border-b border-gray-200">
                <img
                  src={
                    userData?.profilePic || "https://via.placeholder.com/150"
                  }
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-[#3d4f3a]/20"
                />
                <span className="font-semibold text-[#3d4f3a] text-base">
                  {userData?.name || "User"}
                </span>
              </div>

              <button
                onClick={() => navigate("/profile")}
                className="text-left px-3 py-2.5 w-full rounded-lg text-gray-700 hover:bg-[#3d4f3a]/5 hover:text-[#3d4f3a] transition-all font-medium"
              >
                Profile Settings
              </button>
              <button
                onClick={() => navigate("/reservations")}
                className="text-left px-3 py-2.5 w-full rounded-lg text-gray-700 hover:bg-[#3d4f3a]/5 hover:text-[#3d4f3a] transition-all font-medium"
              >
                Reservations
              </button>
              <button
                onClick={() => navigate("/favorites")}
                className="text-left px-3 py-2.5 w-full rounded-lg text-gray-700 hover:bg-[#3d4f3a]/5 hover:text-[#3d4f3a] transition-all font-medium"
              >
                Favorites
              </button>
              <hr className="border-gray-200 my-2" />
              <button
                onClick={handleLogout}
                className="text-left px-3 py-2.5 w-full rounded-lg text-red-600 hover:bg-red-50 transition-all font-medium"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
