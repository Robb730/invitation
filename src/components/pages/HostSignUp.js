import { PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";
import bg from "./hostpage-comp/images/hostsignup2.jpg";
import { Link } from "react-router-dom";
import axios from "axios";
import { createUserWithEmailAndPassword } from "firebase/auth";
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
        subscribed: false,
        profilePic:
          "https://static.vecteezy.com/system/resources/thumbnails/020/911/740/small/user-profile-icon-profile-avatar-user-icon-male-icon-face-icon-profile-icon-free-png.png",
      });

      setUserId(user.uid);
      setShowPayment(true);
      alert("Please complete your PayPal payment.");
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row justify-center items-center bg-cover bg-center bg-fixed px-4 sm:px-8 py-10"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* LEFT SIDE: Info Section */}
      <div className="flex-1 flex flex-col justify-center items-start text-white px-4 sm:px-8 mb-10 md:mb-0 md:pr-10">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Become a Host</h1>
        <p className="text-gray-200 text-sm sm:text-base leading-relaxed mb-6">
          Share your property, connect with travelers, and earn income while offering unique stays.
        </p>
        <Link to="/" className="text-olive-light hover:underline">
          Go back to homepage
        </Link>
      </div>

      {/* RIGHT SIDE: Signup Form */}
      {/* RIGHT SIDE: Signup Form */}
      <div className="flex-1 bg-white/20 rounded-2xl p-8 flex flex-col items-center justify-center w-full max-w-3xl h-auto shadow-2xl backdrop-blur-md border border-white/30">
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-white"
          onSubmit={handleSignUp}
        >
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            id="confirmPassword"
            className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark"
          />
          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark"
          />
          <input
            type="text"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark"
          />
          <textarea
            placeholder="Describe your property"
            value={propertyDetails}
            onChange={(e) => setPropertyDetails(e.target.value)}
            rows="3"
            className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark md:col-span-2"
          />

          <button
            type="submit"
            className="bg-olive-dark hover:bg-olive duration-500 text-white font-semibold rounded-lg p-3 mt-2 shadow-lg w-full md:col-span-2"
          >
            Become Host
          </button>
        </form>
      </div>


        {/* ✅ PAYPAL PAYMENT MODAL */}
        {showPayment && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 px-4">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md text-center">
              <h2 className="text-xl font-semibold mb-3 text-olive-dark">
                Complete Your Host Subscription
              </h2>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                Pay ₱499/month to activate your hosting privileges.
              </p>

              <PayPalButtons
                style={{ layout: "vertical" }}
                createOrder={(data, actions) =>
                  actions.order.create({
                    purchase_units: [
                      {
                        amount: { value: "9.99", currency_code: "USD" },
                        description: "Monthly Host Subscription",
                      },
                    ],
                  })
                }
                onApprove={async (data, actions) => {
                  await actions.order.capture();
                  await setDoc(
                    doc(db, "users", userId),
                    { subscribed: true },
                    { merge: true }
                  );

                  const currentUser = auth.currentUser;
                  if (currentUser) {
                    await axios.post(
                      "https://custom-email-backend.onrender.com/send-verification",
                      {
                        email: currentUser.email,
                        displayName: fullName,
                      }
                    );
                    alert(
                      "Payment successful! Verification email sent. Please check your inbox."
                    );
                  } else {
                    alert(
                      "Payment successful! Please log in again to verify your account."
                    );
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
                className="mt-4 w-full text-sm text-gray-500 hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      
    </div>
  );
};

export default HostSignUp;
