// Search.js
import React, { useEffect, useState, useRef } from "react";
import bgVid from "./images/homepage_vid.mp4";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebaseConfig";


const Search = ({ user, onSearch }) => {
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("");
  const [allListings, setAllListings] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const suggestionsRef = useRef(null);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);



  // Helper to extract region (third-from-last)
  const getRegion = (locationStr) => {
    if (!locationStr) return null;
    const parts = locationStr.split(",").map((p) => p.trim());
    return parts.length >= 3 ? parts[parts.length - 3] : parts[parts.length - 1];
  };

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest(".guest-dropdown-parent")) {
        setShowGuestDropdown(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);


  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFullName(data.name || data.fullName || "Guest");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // fetch listings once to build suggestion list
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const listingsRef = collection(db, "listings");
        const snapshot = await getDocs(listingsRef);
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAllListings(data.filter((l) => l.status === "Active"));
      } catch (err) {
        console.error("Error fetching listings for search suggestions:", err);
      }
    };
    fetchListings();
  }, []);

  // build suggestions whenever location input or listings change
  useEffect(() => {
    if (!location) {
      // show top regions when input empty
      const uniqueRegions = Array.from(
        new Set(allListings.map((l) => getRegion(l.location)).filter(Boolean))
      );
      setFilteredSuggestions(
        uniqueRegions.map((r) => ({ type: "region", value: r })).slice(0, 8)
      );
      return;
    }

    const q = location.trim().toLowerCase();

    // match by region or contains in full location or category
    const regionMatches = [];
    const addressMatches = [];
    const categoryMatches = [];

    const seen = new Set();

    for (const l of allListings) {
      const region = getRegion(l.location);
      if (region && region.toLowerCase().includes(q) && !seen.has(region)) {
        regionMatches.push({ type: "region", value: region });
        seen.add(region);
      }

      if (l.location && l.location.toLowerCase().includes(q) && !seen.has(l.location)) {
        addressMatches.push({ type: "address", value: l.location });
        seen.add(l.location);
      }

      if (l.category && l.category.toLowerCase().includes(q) && !seen.has(l.category)) {
        categoryMatches.push({ type: "category", value: l.category });
        seen.add(l.category);
      }

      if (regionMatches.length + addressMatches.length + categoryMatches.length >= 8) break;
    }

    setFilteredSuggestions([...regionMatches, ...addressMatches, ...categoryMatches].slice(0, 8));
  }, [location, allListings]);

  // click outside to close suggestions
  useEffect(() => {
    const handler = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const startSearch = () => {
    if (onSearch) {
      onSearch({ location, date, guests });
    }
  };


  const onSuggestionClick = (s) => {
    setLocation(s.value);
    setSuggestionsOpen(false);
    // keep focus and allow search or user to edit
  };

  const userName = fullName || "Guest";

  return (
    <div className="flex justify-center items-center mt-16 relative w-full h-[24rem] sm:h-[28rem] md:h-[30rem] overflow-visible z-0">
      <video
        src={bgVid}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-80"
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 text-center p-6 w-full max-w-5xl">
        <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold leading-snug">
          Welcome Home
          <span className="text-olive">{user ? `, ${userName}` : ""}</span>
        </h2>
        <p className="text-white mt-3 text-sm sm:text-base md:text-lg">
          Find unique stays and experiences around
        </p>

        <div className="mt-6 bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl sm:rounded-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between shadow-2xl overflow-visible w-[92%] sm:w-[85%] md:w-[80%] mx-auto transition-all duration-500">
          {/* WHERE */}
          <div className="relative flex-1 px-4 py-2 sm:py-3 border-b sm:border-b-0 sm:border-r border-white/20 text-left" ref={suggestionsRef}>
            <label className="text-[11px] font-semibold text-white/90 block mb-[2px] tracking-wide">Where</label>
            <input
              type="text"
              placeholder="Search destinations"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setSuggestionsOpen(true);
              }}
              onFocus={() => setSuggestionsOpen(true)}
              className="w-full bg-transparent placeholder:text-white/70 text-white text-[13px] focus:outline-none"
            />

            {/* Suggestions dropdown */}
            {suggestionsOpen && filteredSuggestions.length > 0 && (
              <div className="absolute left-4 right-4 mt-2 bg-white rounded-xl shadow-xl max-h-64 overflow-auto z-50">
                {filteredSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSuggestionClick(s)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b last:border-b-0"
                  >
                    <div className="text-sm font-medium text-gray-800">
                      {s.value}
                    </div>
                    <div className="text-xs text-gray-500">
                      {s.type === "region" ? "Region" : s.type === "address" ? "Address" : "Category"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* WHEN */}
          <div className="flex-1 px-4 py-2 sm:py-3 border-b sm:border-b-0 sm:border-r border-white/20 text-left">
            <label className="text-[11px] font-semibold text-white/90 block mb-[2px] tracking-wide">When</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-white text-[13px] focus:outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>

          {/* WHO */}
          <div
            className="relative flex-1 px-4 py-2 sm:py-3 border-b sm:border-b-0 sm:border-r border-white/20 text-left guest-dropdown-parent"
          >
            <label className="text-[11px] font-semibold text-white/90 block mb-[2px] tracking-wide">
              Who
            </label>
            <input
              type="text"
              placeholder="Add guests"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              onFocus={() => setShowGuestDropdown(true)}
              className="w-full bg-transparent placeholder:text-white/70 text-white text-[13px] focus:outline-none"
            />

            {/* Guest dropdown (same style as “Where” suggestions) */}
            {showGuestDropdown && (
              <div className="absolute left-4 right-4 mt-2 bg-white rounded-xl shadow-xl max-h-64 overflow-auto z-50">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setGuests(String(n));
                      setShowGuestDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b last:border-b-0"
                  >
                    <div className="text-sm font-medium text-gray-800">
                      {n} {n === 1 ? "guest" : "guests"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>



          {/* SEARCH BUTTON */}
          <div className="px-4 py-2 sm:py-3 flex justify-center items-center">
            <button
              onClick={startSearch}
              className="w-full sm:w-auto bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold px-6 py-2 rounded-full hover:bg-olive/40 transition-all duration-300 shadow-md text-[13px] sm:text-sm"
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
