import React, { useState, useEffect } from 'react';
import HostNav from './hostpage-comp/HostNav';
import SideDash from './hostpage-comp/SideDash';
import Dashboard from './hostpage-comp/Dashboard';
import Listings from './hostpage-comp/Listings';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

const HostPage = () => {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false); // 🟢 for hamburger toggle

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen); // 🟢 toggle function

  return (
    <div className="bg-beige min-h-screen">
      <HostNav user={user} toggleSidebar={toggleSidebar} /> {/* 🟢 Pass toggle to nav */}
      <div className="flex flex-col md:flex-row">
        {/* 🟢 Sidebar — pass isOpen and toggleSidebar */}
        <SideDash
          setActivePage={setActivePage}
          isOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
        />

        <div className="md:ml-64 pt-24 px-4 md:px-10 w-full">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default HostPage;
