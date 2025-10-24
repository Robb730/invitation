import React, { useEffect } from "react";
import { getAuth, applyActionCode } from "firebase/auth";
import logo from "./pages/homepage-comp/images/kubohublogo_olive.svg";
import logoBeige from "./pages/homepage-comp/images/kubohublogo_beige.svg";
import Navbar from "./pages/homepage-comp/Navbar";

const Verified = () => {
  useEffect(() => {
    const auth = getAuth();
    const urlParams = new URLSearchParams(window.location.search);
    const oobCode = urlParams.get("oobCode");

    if (oobCode) {
      applyActionCode(auth, oobCode)
        .then(() => {
          // Email verified successfully
        })
        .catch((error) => {
          console.error("Error verifying email:", error);
        });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-olive to-olive-dark text-center px-4">
      <Navbar/>
      <div className='bg-beige h-16 flex opac items-center px-10 gap-x-3 fixed top-0 w-full z-10 shadow-xl'>
      <div className="flex items-center gap-x-3">
        <img 
          src={logo} 
          alt="KuboHub Logo" 
          className="h-12 w-12 object-contain"
        />
        <h1 className="text-olive-dark text-2xl font-bold">KuboHub</h1>
      </div>
      </div>
      {/* Logo */}
      <img
        src={logoBeige}
        alt="KuboHub Logo"
        className="w-28 mb-6 animate-fadeIn"
      />

      {/* Card */}
      <div className="bg-white/95 p-10 rounded-2xl shadow-2xl max-w-md w-full animate-slideUp">
        <h1 className="text-4xl font-bold text-olive mb-4">Email Verified</h1>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Your email has been successfully verified! You can now log in to your
          KuboHub account and start exploring.
        </p>
        <a
          href="/login"
          className="inline-block bg-olive-dark text-white px-8 py-3 rounded-xl font-semibold hover:bg-olive transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Go to Login
        </a>
      </div>

      
    </div>
  );
};

export default Verified;
