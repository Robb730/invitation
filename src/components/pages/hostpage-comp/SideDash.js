import React, {useEffect, useState} from "react";
import {collection, onSnapshot, query, where} from "firebase/firestore";
import {db} from "../../../firebaseConfig";
import {getAuth} from "firebase/auth"


const SideDash = ({ setActivePage, isOpen, toggleSidebar, activePage }) => {
  const [hasUnread, setHasUnread] = useState(false);
  const auth = getAuth();
  const hostId = auth.currentUser?.uid;

  useEffect(() => {
    if (!hostId) return;

    const q = query(collection(db, "notifications"), where("hostId", "==", hostId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const unread = snapshot.docs.some((doc) => !doc.data().isRead);
      setHasUnread(unread);
    });

    return () => unsubscribe();
  }, [hostId]);

  const menuItems = [
    { label: "Dashboard" },
    { label: "My Listings" },
    { label: "Reservations" },
    { label: "Messages" },
    { label: "Points & Rewards" },
    { label: "Notifications" },
    { label: "Earnings" },
    { label: "Settings" },
  ];

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed top-16 left-0 h-full w-64 bg-olive text-white flex flex-col py-10 px-6 shadow-lg z-40 transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <nav className="flex flex-col gap-y-3">
          {menuItems.map((item, idx) => {
            const isActive = activePage === item.label;
            const showBadge = item.label === "Notifications" && hasUnread;

            return (
              <button
                key={idx}
                onClick={() => {
                  setActivePage(item.label);
                  if (window.innerWidth < 768) toggleSidebar(); // close sidebar after tap on mobile
                }}
                className={`flex items-center gap-x-3 px-4 py-2 rounded-lg font-medium text-sm transition duration-200
                  ${
                    isActive
                      ? "bg-white/25"
                      : "hover:bg-white/15"
                  }`}
              >
                <span>{item.label}</span>
                {showBadge && (
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Dark background overlay on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};

export default SideDash;
