import {useState} from "react";
import bg from "./hostpage-comp/images/hostsignup2.jpg";
import {Link} from "react-router-dom";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const HostSignUp = () => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [propertyDetails, setPropertyDetails] = useState("");

    const handleSignUp = async (e) => {
        e.preventDefault();
        try{
            const confirmPassword = document.getElementById('confirmPassword').value;
            if(password !== confirmPassword)
            {
                alert("Passwords do not match");
                return;
            }
            else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await sendEmailVerification(user);

                await setDoc(doc(db, "users", user.uid), {
                                fullName,
                                phone,
                                address,
                                propertyDetails,
                                email: user.email,
                                role: "host",
                                joinedAt: serverTimestamp(),
                            });

                alert("Verification email sent. Please check your inbox.");

            }
        } catch (e) {
            alert(e.message);
        }
    }
  return (
    <div
      className="h-screen flex justify-center items-center bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Main container */}
      <div className="flex flex-row bg-white/15 backdrop-blur-md border border-white/30 shadow-2xl rounded-3xl w-[80%] max-w-5xl p-8">
        
        {/* Left side - intro */}
        <div className="flex-1 flex flex-col justify-center items-start text-white px-10">
          <h1 className="text-4xl font-bold mb-3">Become a Host</h1>
          <p className="text-gray-200 leading-relaxed mb-6">
            Share your property, connect with travelers, and earn income while offering unique stays.
          </p>
          <Link to = "/"><p>Go back to homepage</p></Link>
        </div>

        {/* Right side - form */}
        <div className="flex-1 bg-white/20 rounded-2xl p-8 flex flex-col items-center justify-center">
          <form className="flex flex-col gap-4 w-full max-w-sm text-white">
            <input
              type="text"
              value = {fullName}
              placeholder="Full Name"
              onChange={(e) => setFullName(e.target.value)}
              className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark"
            />
            <input
              type="email"
              value = {email}
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
              className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark"
            />
            <input
              type="password"
              value = {password}
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark"
            />
            <input
              type="password"
            
              placeholder="Confirm Password"
              id = 'confirmPassword'
              className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark"
            />
            <input
              type="text"
              value={phone}
              placeholder="Phone Number"
              onChange={(e) => setPhone(e.target.value)}
              className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark"
            />
            <input
              type="text"
              value = {address}
              placeholder="Address"
              onChange={(e) => setAddress(e.target.value)}
              className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark"
            />
            <textarea
              placeholder="Describe your property"
              value = {propertyDetails}
              onChange={(e) => setPropertyDetails(e.target.value)}
              rows="2"
              className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark"
            />

            <button
              onClick={handleSignUp}
              className="bg-olive-dark hover:bg-olive duration-500 text-white font-semibold rounded-lg p-3 mt-3 shadow-lg"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HostSignUp;
