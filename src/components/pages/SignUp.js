import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import bg2 from './homepage-comp/images/forest-bg.jpg'


const SignUp = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    
    
    

    const handleSignUp = async (e) => {
        try{
            const confirmPassword = document.getElementById('confirmPassword').value;
            if(password !== confirmPassword)
            {
                alert("Passwords do not match");
                return;
            }
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await sendEmailVerification(user);
            

            
            await setDoc(doc(db, "users", user.uid), {
                name,
                address,
                email: user.email,
                role: "guest",
                joinedAt: serverTimestamp(),
            });

            alert("Verification email sent. Please check your inbox.");
        }
        catch (error){
            alert(error.message);
        }
    }
  return (
    <div className="min-h-screen flex bg-beige">
  {/* LEFT SIDE - Form */}
  <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-16">
    <div className="w-full max-w-sm">
      <h1 className="text-3xl font-extrabold text-olive-dark mb-2">Sign Up</h1>
      <p className="text-gray-600 mb-8 text-sm">
        Already have an account?{" "}
        <Link to="/login" className="text-olive-dark font-semibold hover:underline">
          Log in
        </Link>
      </p>

      {/* Form */}
      <div className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-olive/40 outline-none"
        />
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address"
          className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-olive/40 outline-none"
        />
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone Number"
          className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-olive/40 outline-none"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-olive/40 outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-olive/40 outline-none"
        />
        <input
          type="password"
          id="confirmPassword"
          placeholder="Confirm Password"
          className="border border-gray-300 rounded-lg p-3 w-full focus:ring-2 focus:ring-olive/40 outline-none"
        />

        <button
          onClick={handleSignUp}
          className="bg-olive-dark text-white w-full py-3 rounded-lg font-semibold hover:bg-olive transition duration-500"
        >
          Create Account
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center my-6">
        <div className="flex-grow h-px bg-gray-300"></div>
        <span className="px-3 text-gray-500 text-sm">OR</span>
        <div className="flex-grow h-px bg-gray-300"></div>
      </div>

      {/* Social Sign Up */}
      <button
        
        className="flex items-center justify-center w-full border border-gray-300 rounded-lg py-3 hover:bg-gray-50 transition duration-300"
      >
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="Google"
          className="w-5 h-5 mr-2"
        />
        <span className="text-gray-700 font-medium">Sign up with Google</span>
      </button>
    </div>
  </div>

  {/* RIGHT SIDE - Illustration / Info */}
  <div
    className="hidden md:flex w-1/2 text-white flex-col justify-center items-center p-10 relative overflow-hidden"
    style={{
      backgroundImage: `url(${bg2})`,
      backgroundSize: "cover",
      backgroundPosition: "center"
    }}
  >
    <div className="absolute inset-0 bg-olive-dark/20 backdrop-blur-sm"></div>

    <div className="relative z-10 max-w-md text-center">
      <h2 className="text-2xl font-bold mb-4">Welcome to KuboHub</h2>
      <p className="text-sm text-olive-light mb-6">
        Manage your account effortlessly. Enjoy modern design, smooth experience, and simple access
        to your data — all in one place.
      </p>

      <div className="bg-white/10 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-2">Get Started Today</h3>
        <p className="text-sm text-olive-light">
          Create your account and join our growing community.
        </p>
      </div>
    </div>
  </div>
</div>


  )
}

export default SignUp
