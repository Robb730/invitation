import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import bg from "./homepage-comp/images/forest-bg.jpg";
import logo from "./homepage-comp/images/kubohublogo_beige.svg"; // adjust path
import SplitText from "./homepage-comp/SplitText";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const googleProvider = new GoogleAuthProvider();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await user.reload();

      if (user.emailVerified) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data();

        if (userData.role === "guest") {
          alert("Login successful");
          navigate("/");
        } else if (userData.role === "host") {
          alert("Login successful");
          navigate("/hostpage");
        } else {
          alert("Unknown user role. Contact support.");
        }
      } else {
        alert("Please verify your email before logging in.");
      }
    } catch (error) {
      alert("Invalid email or password");
    }
  };

  const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* LEFT SECTION */}
      <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-olive-dark/70 to-black/60 text-beige backdrop-blur-md p-12">
        <div className="text-center">
          <img src={logo} alt="KuboHub Logo" className="w-28 mx-auto mb-6 drop-shadow-lg" />
          <SplitText
          text="Welcome Back 🌿"
          className="text-5xl font-extrabold tracking-wide mb-4"
          delay={100}
          duration={0.6}
          ease="power3.out"
          splitType="chars"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
          rootMargin="-100px"
          textAlign="center"
          onLetterAnimationComplete={handleAnimationComplete}
          />
          <p className="text-lg text-beige/90 max-w-md mx-auto leading-relaxed">
            Step into comfort again. Sign in to explore new stays, experiences, and hosts
            across the islands — with the cozy touch of <span className="text-olive-light font-semibold">KuboHub</span>.
          </p>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex justify-center items-center w-full md:w-1/2 bg-beige/95 backdrop-blur-xl p-6 sm:p-10">
        <div className="bg-white/80 backdrop-blur-xl border border-olive/20 rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-md transform hover:scale-[1.01] transition-all duration-300">
          <h2 className="text-4xl font-bold text-center text-olive-dark mb-6">Login</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="flex flex-col gap-4"
          >
            <input
            id = "email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="text"
              placeholder="Email Address"
              className="border border-olive/40 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-olive/60 placeholder-gray-500 text-gray-800 transition"
            />
            <input
            id = "password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
              className="border border-olive/40 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-olive/60 placeholder-gray-500 text-gray-800 transition"
            />

            <button
              type = "submit"
              className="bg-olive-dark text-white rounded-lg p-3 w-full mt-2 font-semibold hover:bg-olive transition-all duration-500 shadow-lg hover:shadow-xl"
            >
              Sign In
            </button>

            <button
              onClick={handleGoogleSignIn}
              className="flex justify-center items-center gap-3 border border-olive/40 bg-white text-olive-dark font-semibold rounded-lg p-3 w-full hover:bg-olive hover:text-white transition-all duration-500 shadow-md"
            >
              <svg
                className="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.3 0 6.3 1.1 8.7 3.2l6.5-6.5C34.7 2.4 29.7 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.6 5.9C12 13.2 17.6 9.5 24 9.5z"
                />
                <path
                  fill="#34A853"
                  d="M46.1 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.5c-.6 3-2.4 5.5-4.9 7.2l7.6 5.9C43.3 38.2 46.1 31.8 46.1 24.5z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.2 28.8c-1-3-1-6.2 0-9.2l-7.6-5.9C.9 18 0 21 0 24s.9 6 2.6 10.3l7.6-5.5z"
                />
                <path
                  fill="#4285F4"
                  d="M24 48c6.5 0 12-2.1 16-5.7l-7.6-5.9c-2.1 1.4-4.7 2.1-8.4 2.1-6.4 0-12-3.7-14.8-9.4l-7.6 5.5C6.6 42.6 14.6 48 24 48z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="text-center mt-6 text-gray-700">
              <p>
                Don’t have an account?{" "}
                <Link to="/signup">
                  <span className="text-olive-dark font-semibold hover:underline">
                    Sign up
                  </span>
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
