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
  const [showTerms, setShowTerms] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [userId, setUserId] = useState(null);

  // 🟢 Handle Sign Up
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
        ewallet: 0,
        profilePic:
          "https://static.vecteezy.com/system/resources/thumbnails/020/911/740/small/user-profile-icon-profile-avatar-user-icon-male-icon-face-icon-profile-icon-free-png.png",
      });

      setUserId(user.uid);
      setShowTerms(true); // 🔹 Show terms first before payment
    } catch (e) {
      alert(e.message);
    }
  };

  // 🟢 Proceed to PayPal after agreeing to terms
  const handleConfirmTerms = () => {
    if (!acceptedTerms) {
      alert("Please accept the Terms and Conditions before continuing.");
      return;
    }
    setShowTerms(false);
    setShowPayment(true);
  };

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row justify-center items-center bg-cover bg-center bg-fixed px-4 sm:px-8 py-10"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* LEFT SIDE */}
      <div className="flex-1 flex flex-col justify-center items-start text-white px-4 sm:px-8 mb-10 md:mb-0 md:pr-10 drop-shadow-lg">
        <h1 className="text-4xl sm:text-5xl font-bold mb-3 leading-tight">
          Become a Host
        </h1>
        <p className="text-gray-200 text-base sm:text-lg leading-relaxed mb-6 max-w-lg">
          Share your property, connect with travelers, and earn income by offering unique and memorable stays.
        </p>
        <Link to="/" className="text-olive-light hover:underline text-sm">
          ← Go back to homepage
        </Link>
      </div>

      {/* RIGHT SIDE FORM */}
      <div className="flex-1 bg-white/25 rounded-3xl p-8 flex flex-col items-center justify-center w-full max-w-3xl shadow-2xl backdrop-blur-lg border border-white/40">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Host Registration
        </h2>

        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-white"
          onSubmit={handleSignUp}
        >
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            id="confirmPassword"
            required
            className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark"
          />
          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark"
          />
          <input
            type="text"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark"
          />
          <textarea
            placeholder="Describe your property"
            value={propertyDetails}
            onChange={(e) => setPropertyDetails(e.target.value)}
            rows="3"
            required
            className="p-3 rounded-lg border border-white/40 bg-transparent placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-olive-dark md:col-span-2"
          />
          <button
            type="submit"
            className="bg-olive-dark hover:bg-olive duration-500 text-white font-semibold rounded-lg p-3 mt-2 shadow-lg w-full md:col-span-2"
          >
            Become a Host
          </button>
        </form>
      </div>

      {/* 🧾 TERMS & CONDITIONS MODAL */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 overflow-y-auto max-h-[80vh]">
            <h2 className="text-2xl font-semibold text-olive-dark mb-4 text-center">
              Terms and Conditions
            </h2>

            <div className="text-gray-700 text-sm leading-relaxed space-y-3 mb-6">
              <p>
                Welcome to KuboHub! By becoming a host, you agree to the following terms:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>All property information provided must be accurate and truthful.</li>
                <li>Hosts are responsible for maintaining cleanliness and safety of their property.</li>
                <li>Any form of discrimination or harassment is strictly prohibited.</li>
                <li>Hosts must comply with all local housing, tax, and safety regulations.</li>
                <li>Subscription fees are billed monthly and non-refundable once paid.</li>
                <li>Users who violate terms may have hosting privileges suspended or revoked.</li>
                <li>KuboHub is not liable for damages, cancellations, or user disputes.</li>
                <li>By clicking confirm, you acknowledge reading and accepting all rules stated herein.</li>
              </ul>
              <p>
                Thank you for choosing to share your space responsibly with travelers.
              </p>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="agree"
                checked={acceptedTerms}
                onChange={() => setAcceptedTerms(!acceptedTerms)}
              />
              <label htmlFor="agree" className="text-sm text-gray-700">
                I have read and agree to the Terms and Conditions.
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowTerms(false)}
                className="px-4 py-2 rounded-lg text-sm bg-gray-300 hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTerms}
                className="px-4 py-2 rounded-lg text-sm bg-olive-dark text-white hover:bg-olive transition"
              >
                Confirm & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💳 PAYPAL PAYMENT MODAL */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 px-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md text-center">
            <h2 className="text-xl font-semibold mb-3 text-olive-dark">
              Complete Your Host Subscription
            </h2>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              Pay ₱499/month (approx $9.99 USD) to activate your hosting privileges.
            </p>

            <PayPalButtons
              style={{ layout: "vertical" }}
              createOrder={(data, actions) =>
                actions.order.create({
                  purchase_units: [
                    {
                      amount: { value: "499", currency_code: "PHP" },
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
