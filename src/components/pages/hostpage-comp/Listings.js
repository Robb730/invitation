import React, { useEffect, useState, useRef, useMemo } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

// ----- Main Component -----
const Listings = ({ user }) => {
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    draft: 0,
  });
  const [filter, setFilter] = useState("Active");

  // ✅ Fetch listings owned by current user
  useEffect(() => {
    const fetchUserListings = async () => {
      if (!user) return;

      try {
        const listingsRef = collection(db, "listings");
        const q = query(listingsRef, where("hostId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const listingsData = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setListings(listingsData);

        // 🔹 Compute statistics
        setStats({
          total: listingsData.length,
          active: listingsData.filter((l) => l.status === "Active").length,
          inactive: listingsData.filter((l) => l.status === "Inactive").length,
          draft: listingsData.filter((l) => l.status === "Draft").length,
        });
      } catch (error) {
        console.error("Error fetching listings:", error);
      }
    };

    fetchUserListings();
  }, [user]);

  // 🔹 Filter listings by selected status
  const filteredListings = listings.filter((l) => l.status === filter);

  return (
    <div className="min-h-screen bg-beige p-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-olive-dark">My Listings</h1>
        <button
          className="bg-olive-dark text-white px-5 py-2 rounded-lg font-medium shadow-md hover:bg-olive transition duration-300"
        >
          + Add New Listing
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-10">
        <StatsCard
          title="Total Listings"
          count={stats.total}
          bg="bg-white/60"
          text="text-olive-dark"
        />
        <StatsCard
          title="Active Listings"
          count={stats.active}
          bg="bg-green-50"
          text="text-green-800"
          onClick={() => setFilter("Active")}
        />
        <StatsCard
          title="Inactive Listings"
          count={stats.inactive}
          bg="bg-red-50"
          text="text-red-800"
          onClick={() => setFilter("Inactive")}
        />
        <StatsCard
          title="Draft Listings"
          count={stats.draft}
          bg="bg-yellow-100"
          text="text-yellow-800"
          onClick={() => setFilter("Draft")}
        />
      </div>

      {/* Listings Grid */}
      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-600 mt-20">
          <p>No {filter.toLowerCase()} listings found.</p>
        </div>
      )}
    </div>
  );
};

// ----- Listing Card -----
const ListingCard = ({ listing, onEdit }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef(null);

  // ✅ Keep image array stable between renders
  const images = useMemo(() => {
    if (!listing.images) return [];
    return Array.isArray(listing.images) ? listing.images : [listing.images];
  }, [listing.images]);

  // ✅ Slideshow effect (no ESLint warnings)
  useEffect(() => {
    if (isHovered && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 1500);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isHovered, images.length]);

  const statusColor =
    {
      Active: "bg-green-100 text-green-700",
      Inactive: "bg-gray-300 text-gray-700",
      Draft: "bg-yellow-100 text-yellow-800",
    }[listing.status] || "bg-gray-300 text-gray-700";

  return (
    <div
      className="bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl p-4 shadow-md hover:scale-[1.02] transition duration-300 relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCurrentImageIndex(0);
      }}
    >
      {/* 🖼 Slideshow */}
      <div className="relative w-full h-48 rounded-xl overflow-hidden">
        {images.length > 0 ? (
          images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={listing.title}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                idx === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-500">
            No image
          </div>
        )}
      </div>

      {/* ℹ Listing Info */}
      <h3 className="text-lg font-semibold text-olive-dark mt-4">
        {listing.title || "Untitled Listing"}
      </h3>
      <p className="text-sm text-olive-dark/70 mt-1">
        {listing.location || "No location"}
      </p>
      <p className="text-sm text-olive-dark/90 mt-2 font-medium">
        ₱{listing.price || "0"}
      </p>

      <div className="flex justify-between items-center mt-4">
        <span className={`${statusColor} px-3 py-1 rounded-full text-xs font-medium`}>
          {listing.status}
        </span>
        <button
          className="text-sm font-medium text-olive-dark hover:underline"
          onClick={onEdit}
        >
          Edit
        </button>
      </div>
    </div>
  );
};

// ----- Stats Card -----
const StatsCard = ({ title, count, bg, text, onClick }) => (
  <div
    className={`${bg} border border-white/30 rounded-2xl p-6 text-center shadow-md w-52 cursor-pointer`}
    onClick={onClick}
  >
    <h3 className={`text-xl font-semibold ${text}`}>{title}</h3>
    <p className={`text-3xl font-bold ${text} mt-2`}>{count}</p>
  </div>
);

export default Listings;
