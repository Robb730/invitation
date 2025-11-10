import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  //GoogleAuthProvider,
  //signInWithPopup,
} from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import bg from "./homepage-comp/images/forest-bg.jpg";
import logo from "./homepage-comp/images/kubohublogo_beige.svg";
import SplitText from "./homepage-comp/SplitText";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showAnimation, setShowAnimation] = useState(false);
  const navigate = useNavigate();
  //const googleProvider = new GoogleAuthProvider();

  useEffect(() => {
    setShowAnimation(true);
  }, []);

  // const handleGoogleSignIn = async () => {
  //   try {
  //     await signInWithPopup(auth, googleProvider);
  //     navigate("/");
  //   } catch (error) {
  //     alert(error.message);
  //   }
  // };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await user.reload();

      if (user.emailVerified) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data();

        if (userData.role === "guest") navigate("/");
        else if (userData.role === "host") navigate("/hostpage");
        else if (userData.role === "admin") navigate("/adminpage");
        else alert("Unknown user role. Contact support.");
      } else {
        alert("Please verify your email before logging in.");
      }
    } catch (error) {
      alert("Invalid email or password");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* LEFT SIDE - Hidden on mobile, shown on md+ */}
      <div className="hidden md:flex flex-col justify-center items-center w-full md:w-1/2 bg-gradient-to-br from-olive-dark/90 to-black/70 text-beige backdrop-blur-md p-10">
        <div className="text-center px-6">
          <img src={logo} alt="KuboHub Logo" className="w-24 mx-auto mb-6" />

          {showAnimation && (
            <SplitText
              text="Welcome Back 🌿"
              className="text-5xl font-extrabold mb-4"
            />
          )}

          <p className="text-beige/90 max-w-md mx-auto leading-relaxed text-lg">
            Step into comfort again. Sign in to explore new stays, experiences, and hosts across the islands — with the cozy touch of{' '}
            <span className="text-olive font-semibold">KuboHub</span>.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Full width on mobile */}
      <div className="flex justify-center items-center w-full md:w-1/2 bg-gradient-to-b from-beige/90 via-white/90 to-beige/80 backdrop-blur-xl p-4 sm:p-6 md:p-10 min-h-screen md:min-h-0">
        <div className="bg-white rounded-3xl border border-olive/20 shadow-xl sm:shadow-2xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md transition-all duration-500 hover:shadow-olive/20">
          
          {/* Mobile-only logo and welcome text */}
          <div className="md:hidden text-center mb-6">
            <img src={logo} alt="KuboHub Logo" className="w-16 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-olive-dark mb-1">Welcome Back 🌿</h1>
            <p className="text-gray-600 text-sm">Sign in to continue</p>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-olive-dark mb-6">
            Login
          </h2>

          <div className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="border border-gray-300 rounded-xl p-3 sm:p-3.5 w-full focus:outline-none focus:ring-2 focus:ring-olive/60 text-gray-800 placeholder-gray-500 text-sm sm:text-base transition-all"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="border border-gray-300 rounded-xl p-3 sm:p-3.5 w-full focus:outline-none focus:ring-2 focus:ring-olive/60 text-gray-800 placeholder-gray-500 text-sm sm:text-base transition-all"
              required
            />

            <button
              onClick={handleLogin}
              className="bg-olive-dark text-white rounded-xl p-3 sm:p-3.5 w-full mt-2 font-semibold hover:bg-olive transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              Sign In
            </button>

            <div className="text-center mt-4 text-gray-700 text-sm sm:text-base">
              <p>
                Don't have an account?{' '}
                <Link to = "/signup">
                <span 
                  onClick={() => console.log('Navigate to signup')}
                  className="text-olive-dark font-semibold hover:underline cursor-pointer"
                >
                  Sign up
                </span>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
