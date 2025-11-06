import React, { useState, useEffect } from "react";
import HostNav from "./hostpage-comp/HostNav";
import SideDash from "./hostpage-comp/SideDash";
import Dashboard from "./hostpage-comp/Dashboard";
import Listings from "./hostpage-comp/Listings";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc} from "firebase/firestore";
import Reservations from "./hostpage-comp/Reservations";
import Messages from "./hostpage-comp/Messages";
import Earnings from "./hostpage-comp/Earnings";
import Settings from "./hostpage-comp/Settings";


const HostPage = () => {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [checkingPaypal, setCheckingPaypal] = useState(true);

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

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const hostData = docSnap.data();
        console.log("The current user is: " + hostData.fullName);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }

    setCheckingPaypal(false);
  });

  return () => unsubscribe();
}, []);

  

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
