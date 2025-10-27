import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebaseConfig'; // adjust path if needed
import logo from './images/kubohublogo_beige.svg'

const Navbar = ({ user }) => {
  const navigate = useNavigate();

  const handleAuthClick = async () => {
    if (user) {
      try {
        await signOut(auth);
        alert("Logged out successfully!");
        navigate('/'); // return to homepage after logout
      } catch (error) {
        alert(error.message);
      }
    } else {
      navigate('/login'); // go to login page
    }
  };
  
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-olive-dark h-16 flex items-center px-5 sm:px-10 fixed top-0 w-full z-10 shadow-xl">
      {/* Left side: Logo and name */}
      <div className="flex items-center gap-x-3">
        <img src={logo} alt="KuboHub Logo" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
        <h1 className="text-beige text-xl sm:text-2xl font-bold">KuboHub</h1>
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

          <button
            onClick={handleAuthClick}
            className="font-semibold bg-beige text-charcoal px-4 py-2 rounded hover:bg-grayish hover:text-beige duration-700"
          >
            {user ? "Logout" : "Login"}
          </button>
        </div>
      </div>

      {/* Mobile hamburger button */}
      <div className="ml-auto md:hidden">
        <button
          className="text-beige focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {/* Hamburger icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
         <div className="absolute top-16 left-0 w-full bg-olive-dark flex flex-col items-center gap-y-3 py-5 shadow-md md:hidden z-50">
          <button className="text-beige font-semibold px-4 py-2 hover:bg-grayish rounded w-11/12">
            Homes
          </button>
          <button className="text-beige font-semibold px-4 py-2 hover:bg-grayish rounded w-11/12">
            Experiences
          </button>
          <button className="text-beige font-semibold px-4 py-2 hover:bg-grayish rounded w-11/12">
            Services
          </button>

          <Link to="/becomehost" className="w-11/12">
            <button className="font-semibold bg-beige text-charcoal px-5 py-2 rounded w-full hover:bg-grayish hover:text-beige duration-700">
              Be a Host
            </button>
          </Link>

          <button
            onClick={handleAuthClick}
            className="font-semibold bg-beige text-charcoal px-4 py-2 rounded w-11/12 hover:bg-grayish hover:text-beige duration-700"
          >
            {user ? "Logout" : "Login"}
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
