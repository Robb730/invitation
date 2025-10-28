import React, { useState, useEffect } from "react";
import HostNav from "./hostpage-comp/HostNav";
import SideDash from "./hostpage-comp/SideDash";
import Dashboard from "./hostpage-comp/Dashboard";
import Listings from "./hostpage-comp/Listings";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const HostPage = () => {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPaypalModal, setShowPaypalModal] = useState(false);
  const [checkingPaypal, setCheckingPaypal] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      
        
        await getDoc(doc(db, "users", currentUser.uid)).then((docSnap) => {
          if (docSnap.exists()) {
            const hostData = docSnap.data();
        console.log("the current user is: "+hostData.fullName);
          if (hostData.paypal === null) {
            // If PayPal is not connected, show modal
            setShowPaypalModal(true);
          }
        }
      });
        
      

      setCheckingPaypal(false);
    });

    return () => unsubscribe();
  }, []);

  const handleConnectPaypal = async () => {
    try {
      // For Sandbox simulation:
      // In a real case, you'd redirect to PayPal OAuth flow.
      const dummyPaypalEmail = "sandbox-host@example.com";

      await updateDoc(doc(db, "users", user.uid), {
        paypal: dummyPaypalEmail,
      });

      setShowPaypalModal(false);
      alert("✅ PayPal account connected (Sandbox simulation).");
    } catch (error) {
      console.error("Error connecting PayPal:", error);
    }
  };

  const renderContent = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard />;
      case "My Listings":
        return <Listings user={user} />;
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
          isOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
        />

        <div className="md:ml-64 pt-24 px-4 md:px-10 w-full">
          {renderContent()}
        </div>
      </div>

      {/* 🔵 PayPal Connection Modal */}
      {showPaypalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4">
              Finish Setting Up Your Host Account
            </h2>
            <p className="text-gray-600 mb-6">
              Connect your PayPal account to receive payments directly to your
              wallet.
            </p>
            <button
              onClick={handleConnectPaypal}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all"
            >
              Connect PayPal (Sandbox)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostPage;
