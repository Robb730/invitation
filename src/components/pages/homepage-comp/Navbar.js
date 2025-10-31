import React, { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import logo from "./images/kubohublogo_beige.svg";

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <nav className="bg-olive-dark h-16 flex items-center px-5 sm:px-10 fixed top-0 w-full z-10 shadow-xl">
      {/* Left side: Logo and name */}
      <div className="flex items-center gap-x-3">
        <Link to="/" className="flex items-center gap-x-3">
    <img
      src={logo}
      alt="KuboHub Logo"
      className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
    />
    <h1 className="text-beige text-xl sm:text-2xl font-bold">KuboHub</h1>
  </Link>
      </div>

      {/* Desktop menu */}
      <div className="hidden md:flex items-center text-center ml-auto justify-between gap-x-4">
        <button className="font-semibold text-beige px-4 py-2 rounded hover:bg-grayish duration-300">
          Homes
        </button>
        <button className="font-semibold text-beige px-4 py-2 rounded hover:bg-grayish duration-300">
          Experiences
        </button>
        <button className="font-semibold text-beige px-4 py-2 rounded hover:bg-grayish duration-300">
          Services
        </button>

        <div className="ml-6 flex items-center gap-x-4">
          <Link to="/becomehost">
            <button className="font-semibold bg-beige text-charcoal px-5 py-2 rounded hover:bg-grayish hover:text-beige duration-700">
              Be a Host
            </button>
          </Link>

          {!user ? (
            <button
              onClick={() => navigate("/login")}
              className="font-semibold bg-beige text-charcoal px-4 py-2 rounded hover:bg-grayish hover:text-beige duration-700"
            >
              Login
            </button>
          ) : (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="rounded-full w-10 h-10 overflow-hidden border-2 border-beige hover:border-grayish transition"
              >
                <img
                  src={userData?.profilePic || "https://via.placeholder.com/150"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </button>

              {/* Profile dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-beige text-charcoal rounded-lg shadow-lg py-2 text-sm font-medium">
                  <p className="block w-full text-left px-4 py-2 font-bold text-olive-dark">{userData.name}</p>
                  <button
                    onClick={() => navigate("/profile")}
                    className="block w-full text-left px-4 py-2 hover:bg-grayish hover:text-beige duration-300"
                  >
                    Profile Settings
                  </button>
                  <button
                    onClick={() => navigate("/reservations")}
                    className="block w-full text-left px-4 py-2 hover:bg-grayish  hover:text-beige duration-300"
                  >
                    Reservations
                  </button>
                  <button
                    onClick={() => navigate("/favorites")}
                    className="block w-full text-left px-4 py-2 hover:bg-grayish  hover:text-beige duration-300"
                  >
                    Favorites
                  </button>
                  <hr className="my-1 border-gray-300" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-grayish  hover:text-beige duration-300"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile hamburger button */}
      <div className="ml-auto md:hidden">
        <button
          className="text-beige focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown menu */}
{menuOpen && (
  <div
  className={`absolute top-16 left-0 w-full bg-olive-dark flex flex-col items-center gap-y-3 py-5 shadow-md md:hidden z-50
    transition-all duration-500 ease-in-out transform
    ${menuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-5 pointer-events-none"}
  `}
>
  {/* Navigation links */}
  <button className="text-beige font-semibold px-4 py-2 hover:bg-grayish hover:text-beige rounded w-11/12 transition">
    Homes
  </button>
  <button className="text-beige font-semibold px-4 py-2 hover:bg-grayish hover:text-beige rounded w-11/12 transition">
    Experiences
  </button>
  <button className="text-beige font-semibold px-4 py-2 hover:bg-grayish hover:text-beige rounded w-11/12 transition">
    Services
  </button>

  <Link to="/becomehost" className="w-11/12">
    <button className="font-semibold bg-beige text-charcoal px-5 py-2 rounded w-full hover:bg-grayish hover:text-beige duration-700 transition">
      Be a Host
    </button>
  </Link>

  {/* User section */}
  {!user ? (
    <button
      onClick={() => navigate("/login")}
      className="font-semibold bg-beige text-charcoal px-4 py-2 rounded w-11/12 hover:bg-grayish hover:text-beige duration-700 transition"
    >
      Login
    </button>
  ) : (
    <div className="w-11/12 bg-beige rounded-lg flex flex-col gap-y-2 p-3 transition">
      {/* Profile Info */}
      <div className="flex items-center gap-x-3 mb-2">
        <img
          src={userData?.profilePic || "https://via.placeholder.com/150"}
          alt="Profile"
          className="w-10 h-10 rounded-full object-cover"
        />
        <span className="font-semibold text-charcoal">{userData?.name || "User"}</span>
      </div>

      {/* Actions */}
      <button
        onClick={() => navigate("/profile")}
        className="text-left px-3 py-2 w-full rounded hover:bg-grayish hover:text-beige duration-300 transition"
      >
        Profile Settings
      </button>
      <button
        onClick={() => navigate("/reservations")}
        className="text-left px-3 py-2 w-full rounded hover:bg-grayish hover:text-beige duration-300 transition"
      >
        Reservations
      </button>
      <button
        onClick={() => navigate("/favorites")}
        className="text-left px-3 py-2 w-full rounded hover:bg-grayish hover:text-beige duration-300 transition"
      >
        Favorites
      </button>
      <hr className="border-gray-300 my-1" />
      <button
        onClick={handleLogout}
        className="text-left px-3 py-2 w-full rounded text-red-600 hover:bg-grayish hover:text-beige duration-300 transition"
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
