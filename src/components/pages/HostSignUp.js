import { PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";
import bg from "./hostpage-comp/images/hostsignup2.jpg";
import { Link } from "react-router-dom";
import axios from "axios"; // ✅ FIX: Import axios
import { createUserWithEmailAndPassword} from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const HostSignUp = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [propertyDetails, setPropertyDetails] = useState("");
  
  const [showPayment, setShowPayment] = useState(false);
  const [userId, setUserId] = useState(null);

  const handleSignUp = async (e) => {
    e.preventDefault();

    try {
      const confirmPassword = document.getElementById("confirmPassword").value;
      if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        fullName,
        phone,
        address,
        propertyDetails,
        email: user.email,
        role: "host",
        joinedAt: serverTimestamp(),
        subscribed: false, // initially false
        profilePic:
          "https://static.vecteezy.com/system/resources/thumbnails/020/911/740/small/user-profile-icon-profile-avatar-user-icon-male-icon-face-icon-profile-icon-free-png.png",
      });

      setUserId(user.uid);
      setShowPayment(true); // show PayPal modal
      alert("Please complete your PayPal payment.");
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div
      className="h-screen flex justify-center items-center bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="flex flex-row bg-white/15 backdrop-blur-md border border-white/30 shadow-2xl rounded-3xl w-[80%] max-w-5xl p-8">
        <div className="flex-1 flex flex-col justify-center items-start text-white px-10">
          <h1 className="text-4xl font-bold mb-3">Become a Host</h1>
          <p className="text-gray-200 leading-relaxed mb-6">
            Share your property, connect with travelers, and earn income while offering unique stays.
          </p>
          <Link to="/">
            <p>Go back to homepage</p>
          </Link>
        </div>

        <div className="flex-1 bg-white/20 rounded-2xl p-8 flex flex-col items-center justify-center">
          <form className="flex flex-col gap-4 w-full max-w-sm text-white">
            <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark" />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark" />
            <input type="password" placeholder="Confirm Password" id="confirmPassword" className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark" />
            <input type="text" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark" />
            <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark" />
            <textarea placeholder="Describe your property" value={propertyDetails} onChange={(e) => setPropertyDetails(e.target.value)} rows="2" className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark" />
            <button onClick={handleSignUp} className="bg-olive-dark hover:bg-olive duration-500 text-white font-semibold rounded-lg p-3 mt-3 shadow-lg">
              Become Host
            </button>
          </form>

          {/* ✅ FIXED PAYPAL PAYMENT SECTION */}
          {showPayment && (
            <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-2xl shadow-2xl w-[90%] max-w-md">
                <h2 className="text-xl font-semibold text-center mb-3 text-olive-dark">
                  Complete Your Host Subscription
                </h2>
                <p className="text-center text-gray-600 mb-4">
                  Pay ₱499/month to activate your hosting privileges.
                </p>

                <PayPalButtons
                  style={{ layout: "vertical" }}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      purchase_units: [
                        {
                          amount: { value: "9.99", currency_code: "USD" },
                          description: "Monthly Host Subscription",
                        },
                      ],
                    });
                  }}
                  onApprove={async (data, actions) => {
                    await actions.order.capture();
                    

                    // ✅ FIX: Only use userId, no userCredential here
                    await setDoc(doc(db, "users", userId), { subscribed: true }, { merge: true });

                    const currentUser = auth.currentUser;
                    if (currentUser) {
                      await axios.post("https://custom-email-backend.onrender.com/send-verification", {
                        email: currentUser.email,
                        displayName: fullName,
                      });
                      alert("Payment successful! Verification email sent. Please check your inbox.");
                    } else {
                      alert("Payment successful! Please log in again to verify your account.");
                    }

                    setShowPayment(false);
                  }}
                  onError={(err) => {
                    console.error(err);
                    alert("Payment failed, please try again.");
                  }}
                />

                <button
                  onClick={() => setShowPayment(false)}
                  className="mt-4 w-full text-center text-sm text-gray-500 hover:underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostSignUp;
