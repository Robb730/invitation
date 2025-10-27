import React from "react";

const SideDash = ({ setActivePage, isOpen, toggleSidebar }) => {
  const menuItems = [
    { label: "Dashboard" },
    { label: "My Listings" },
    { label: "Reservations" },
    { label: "Messages" },
    { label: "Earnings" },
    { label: "Settings" },
    { label: "Log Out" },
  ];

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed top-16 left-0 h-full w-64 bg-olive text-white flex flex-col py-10 px-6 shadow-lg z-40 transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <nav className="flex flex-col gap-y-3">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActivePage(item.label);
                if (window.innerWidth < 768) toggleSidebar(); // close sidebar after tap on mobile
              }}
              className="flex items-center gap-x-3 px-4 py-2 rounded-lg hover:bg-white/15 transition duration-200 font-medium text-sm"
            >
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Dark background overlay on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0  z-30 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};

export default SideDash;
