import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import axios from "axios";
import bg2 from './homepage-comp/images/forest-bg.jpg';
import logo from './homepage-comp/images/kubohublogo_olive.svg';

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const confirmPassword = document.getElementById('confirmPassword').value;
      if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });

      await axios.post("https://custom-email-backend.onrender.com/send-verification", {
        email: user.email,
        displayName: name,
      });

      alert("Verification email sent. Please check your inbox.");

      await setDoc(doc(db, "users", user.uid), {
        name,
        address,
        email: user.email,
        phone,
        role: "guest",
        joinedAt: serverTimestamp(),
      });

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex bg-beige">
      {/* LEFT SIDE - FORM */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-10 md:px-20 py-16">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-10">
          {/* Logo and Title */}
          <div className="flex items-center mb-8">
            <img src={logo} alt="KuboHub Logo" className="h-10 w-10 mr-3" />
            <h1 className="text-3xl font-extrabold text-olive-dark">KuboHub</h1>
          </div>

          <h2 className="text-2xl font-semibold text-olive-dark mb-3">Create Your Account</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Join the <span className="font-semibold text-olive-dark">KuboHub</span> community and start your journey.
          </p>

          <div className="space-y-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-olive/50 outline-none"
            />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address"
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-olive/50 outline-none"
            />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-olive/50 outline-none"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-olive/50 outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-olive/50 outline-none"
            />
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm Password"
              className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-olive/50 outline-none"
            />

            <button
              onClick={handleSignUp}
              className="bg-olive-dark text-white w-full py-3 rounded-lg font-semibold hover:bg-olive transition duration-500 shadow-md hover:shadow-lg"
            >
              Create Account
            </button>
          </div>

          <p className="text-gray-600 mt-6 text-sm text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-olive-dark font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - IMAGE */}
      <div
        className="hidden md:flex w-1/2 text-white flex-col justify-center items-center relative overflow-hidden"
        style={{
          backgroundImage: `url(${bg2})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-olive-dark/30 backdrop-blur-[2px]"></div>
        <div className="relative z-10 max-w-md text-center px-6">
          <h2 className="text-3xl font-bold mb-4">Welcome to KuboHub 🌿</h2>
          <p className="text-base mb-6 text-beige">
            Discover cozy homes and unique stays across the country — comfort, culture, and community await you.
          </p>
          <div className="bg-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-2">Your next adventure starts here</h3>
            <p className="text-sm text-beige/90">
              Sign up and be part of our travel community today.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
