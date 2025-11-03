import React, { useEffect, useState } from "react";
import bgVid from "./images/homepage_vid.mp4";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

const Search = ({ user }) => {
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFullName(data.name || "Guest");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    fetchUserData();
  }, [user]);

  const userName = fullName || "Guest";

  return (
    <div className="flex justify-center items-center mt-16 relative w-full h-[24rem] sm:h-[28rem] md:h-[30rem] overflow-hidden z-0">
      {/* 🔹 Background Video */}
      <video
        src={bgVid}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-80"
      />

      {/* 🔹 Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* 🔹 Foreground Content */}
      <div className="relative z-10 text-center p-6 w-full max-w-5xl">
        <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold leading-snug">
          Welcome Home
          <span className="text-olive">{user ? `, ${userName}` : ""}</span>
        </h2>
        <p className="text-white mt-3 text-sm sm:text-base md:text-lg">
          Find unique stays and experiences around
        </p>

        {/* 🔹 Compact Glass Search Bar */}
        <div
          className="
            mt-6 
            bg-white/15 backdrop-blur-xl border border-white/30 
            rounded-2xl sm:rounded-full
            flex flex-col sm:flex-row 
            items-stretch sm:items-center 
            justify-between
            shadow-2xl overflow-hidden
            w-[92%] sm:w-[85%] md:w-[80%] mx-auto
            transition-all duration-500
          "
        >
          {/* WHERE */}
          <div className="flex-1 px-4 py-2 sm:py-3 border-b sm:border-b-0 sm:border-r border-white/20 text-left">
            <label className="text-[11px] font-semibold text-white/90 block mb-[2px] tracking-wide">
              Where
            </label>
            <input
              type="text"
              placeholder="Search destinations"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-transparent placeholder:text-white/70 text-white text-[13px] focus:outline-none"
            />
          </div>

          {/* WHEN */}
          <div className="flex-1 px-4 py-2 sm:py-3 border-b sm:border-b-0 sm:border-r border-white/20 text-left">
            <label className="text-[11px] font-semibold text-white/90 block mb-[2px] tracking-wide">
              When
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-white text-[13px] focus:outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>

          {/* WHO */}
          <div className="flex-1 px-4 py-2 sm:py-3 border-b sm:border-b-0 sm:border-r border-white/20 text-left">
            <label className="text-[11px] font-semibold text-white/90 block mb-[2px] tracking-wide">
              Who
            </label>
            <input
              type="number"
              placeholder="Add guests"
              min="1"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full bg-transparent placeholder:text-white/70 text-white text-[13px] focus:outline-none"
            />
          </div>

          {/* SEARCH BUTTON */}
          <div className="px-4 py-2 sm:py-3 flex justify-center items-center">
            <button
              className="
                w-full sm:w-auto
                bg-white/20 backdrop-blur-md border border-white/30 
                text-white font-semibold 
                px-6 py-2 
                rounded-full 
                hover:bg-olive/40 transition-all duration-300 shadow-md
                text-[13px] sm:text-sm
              "
            >
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
