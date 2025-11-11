import React, { useState, useEffect } from "react";
import HostNav from "./hostpage-comp/HostNav";
import SideDash from "./hostpage-comp/SideDash";
import Dashboard from "./hostpage-comp/Dashboard";
import Listings from "./hostpage-comp/Listings";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Reservations from "./hostpage-comp/Reservations";
import Messages from "./hostpage-comp/Messages";
import Earnings from "./hostpage-comp/Earnings";
import Settings from "./hostpage-comp/Settings";
import PointsAndRewards from "./hostpage-comp/PointsAndRewards";
import Notifications from "./hostpage-comp/Notifications";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { CreditCard, Calendar, Shield, CheckCircle } from "lucide-react";
import { updateHostTier } from "../../utils/updateHostTier";
import { query, collection, where, getDocs} from "firebase/firestore"

const HostPage = () => {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [checkingPaypal, setCheckingPaypal] = useState(true);
  const [billingDate, setBillingDate] = useState("");
  const [hostPay, setHostPay] = useState(0);
  
  

  const todays = new Date();

  // create the next month date
  const next = new Date(todays);
  next.setMonth(next.getMonth() + 1);

  // format it into "Month DD, YYYY"
  const options = { year: "numeric", month: "long", day: "numeric" };
  const nextBillingDate = next.toLocaleDateString("en-US", options);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        // User is not logged in
        setUser(null);
        setCheckingPaypal(false);
        return;
      }

      // User is logged in
      setUser(currentUser);
      updateHostTier(currentUser.uid);

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const hostData = docSnap.data();
          setBillingDate(hostData.nextbilling);
          console.log("The current user is: " + hostData.fullName);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }

      setCheckingPaypal(false);
    });

    return () => unsubscribe();
  }, []);
  const today = new Date();

  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const yy = String(today.getFullYear()).slice(-2);

  const dateToday = `${mm}${dd}${yy}`;
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [validCodes, setValidCodes] = useState([]);
  const [matchedCodeObj, setMatchedCodeObj] = useState();

  const openPromoModal = () => setPromoModalOpen(true);
  const closePromoModal = () => setPromoModalOpen(false);

  const handlePromoSubmit = async () => {
    const matchedCodeObj = validCodes.find(
      (c) => c.code.toLowerCase() === promoCode.toLowerCase()
    );

    if (!matchedCodeObj) {
      alert("Invalid promo code!");
      return;
    }

    
    alert("You get a "+matchedCodeObj.discount+" off!");

    setMatchedCodeObj(matchedCodeObj);

    setHostPay(hostPay-(hostPay*(matchedCodeObj.discount/100)));
    

    setPromoCode("");
    closePromoModal();
  };

  useEffect(() => {
      const fetchRewardCodes = async () => {
        try {
          const q = query(
            collection(db, "rewards"),
            where("type", "==", "host-payment")
          );
          const snap = await getDocs(q);
    
          const codes = snap.docs.flatMap((docSnap) => {
            const data = docSnap.data();
            return (data.codes || [])
              .filter(c => !c.used) // only unused codes
              .map(c => ({
                ...c,
                code: c.code.toLowerCase(),
                discount: data.discount, // attach parent discount
                rewardId: docSnap.id,
              }));
          });
    
          setValidCodes(codes);
        } catch (error) {
          console.error(error);
        }
      };
    
      fetchRewardCodes();
    }, []);

    const markCodeAsUsed = async (matchedCodeObj) => {
      if (!matchedCodeObj) return;
    
      try {
        const docRef = doc(db, "rewards", matchedCodeObj.rewardId);
        const docSnap = await getDoc(docRef);
    
        if (!docSnap.exists()) return;
    
        const data = docSnap.data();
    
        // Find the code in the codes array
        const codeIndex = data.codes.findIndex(
          (c) => c.code.toLowerCase() === matchedCodeObj.code
        );
    
        if (codeIndex === -1) return;
    
        const updatedCodes = [...data.codes];
        updatedCodes[codeIndex] = {
          ...updatedCodes[codeIndex],
          used: true,
        };
    
        await updateDoc(docRef, { codes: updatedCodes });
    
        // Update local validCodes state to remove the used code
        setValidCodes((prev) =>
          prev.filter((c) => c.code.toLowerCase() !== matchedCodeObj.code)
        );
    
        console.log("Promo code marked as used.");
      } catch (error) {
        console.error("Failed to mark promo code as used:", error);
      }
    };

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const ref = doc(db, "servicepolicy", "main"); // your collection & doc
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();

          setHostPay(data.servicefee);
        } else {
          setHostPay(0);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };

    fetchSubscription();
  }, []);

  if (dateToday === billingDate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                  <CreditCard className="w-8 h-8" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-center mb-2">
                Renew Your Subscription
              </h1>
              <p className="text-emerald-50 text-center text-sm">
                Continue hosting with premium features
              </p>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Subscription Details */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600 text-sm font-medium">
                    Monthly Host Subscription
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <span className="text-4xl font-bold text-gray-900">
                      ₱{hostPay}
                    </span>
                    <span className="text-gray-500 text-sm ml-2">/month</span>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-600 bg-white rounded-lg p-3">
                  <Calendar className="w-4 h-4 mr-2 text-emerald-600" />
                  <span>
                    Next billing:{" "}
                    <span className="font-semibold">{nextBillingDate}</span>
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div className="mb-6 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  What's included:
                </h3>
                {[
                  "Unlimited addition of listings",

                  "Advanced analytics dashboard",
                  "Custom branding options",
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center text-sm text-gray-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-3 text-emerald-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={openPromoModal}
                className="px-6 py-3 bg-olive text-white rounded-xl font-semibold hover:scale-105 active:scale-95 transition"
              >
                Enter Promo Code
              </button>
              {promoModalOpen && (
                <div
                  className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                  onClick={closePromoModal}
                >
                  <div
                    className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h2 className="text-xl font-semibold text-olive mb-4">
                      Enter Promo Code
                    </h2>
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter your promo code"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-olive focus:outline-none text-gray-700 mb-4"
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={closePromoModal}
                        className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePromoSubmit}
                        className="px-4 py-2 bg-olive text-white rounded-xl hover:opacity-90 transition"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* PayPal Button Placeholder */}
              <div className="mb-4">
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                  <PayPalButtons
                    style={{ layout: "vertical" }}
                    createOrder={(data, actions) =>
                      actions.order.create({
                        purchase_units: [
                          {
                            amount: { value: hostPay, currency_code: "PHP" },
                            description: "Monthly Host Subscription",
                          },
                        ],
                      })
                    }
                    onApprove={async (data, actions) => {
                      const next = new Date();
                      next.setMonth(next.getMonth() + 1);

                      const mm2 = String(next.getMonth() + 1).padStart(2, "0");
                      const dd2 = String(next.getDate()).padStart(2, "0");
                      const yy2 = String(next.getFullYear()).slice(-2);

                      const nextMonth = `${mm2}${dd2}${yy2}`;

                      await actions.order.capture();

                      await updateDoc(doc(db, "users", user.uid), {
                        nextbilling: nextMonth,
                      });

                      
                      markCodeAsUsed(matchedCodeObj);
                      alert("Payment Successful");
                      window.location.reload();
                    }}
                    onError={(err) => {
                      console.error(err);
                      alert("Payment failed, please try again.");
                    }}
                  />
                </div>
              </div>
              <div></div>

              {/* Security Badge */}
              <div className="flex items-center justify-center text-xs text-gray-500 gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Secured by PayPal • 256-bit encryption</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Cancel anytime from your account settings
          </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard setActivePage={setActivePage} />;
      case "My Listings":
        return <Listings user={user} />;
      case "Reservations":
        return <Reservations />;
      case "Messages":
        return <Messages />;
      case "Points & Rewards":
        return <PointsAndRewards />;
      case "Notifications":
        return <Notifications />;
      case "Earnings":
        return <Earnings />;
      case "Settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  if (checkingPaypal) return null;

  return (
    <div className="bg-beige min-h-screen relative">
      <HostNav user={user} toggleSidebar={toggleSidebar} />
      <div className="flex flex-col md:flex-row">
        <SideDash
          setActivePage={setActivePage}
          activePage={activePage}
          isOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
        />

        <div className="md:ml-64 pt-24 px-4 md:px-10 w-full">
          {renderContent()}
        </div>
      </div>

      {/* 🔵 PayPal Connection Modal */}
    </div>
  );
};

export default HostPage;
