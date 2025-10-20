import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

const Listings = ({ user }) => {
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });

  useEffect(() => {
    const fetchUserListings = async () => {
      if (!user) return;

      try {
        const listingsRef = collection(db, "listings");
        const q = query(listingsRef, where("hostId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const listingsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setListings(listingsData);

        // Compute stats
        const total = listingsData.length;
        const active = listingsData.filter((l) => l.status === "Active").length;
        const inactive = listingsData.filter((l) => l.status !== "Active").length;

        setStats({ total, active, inactive });
      } catch (error) {
        console.error("Error fetching listings:", error);
      }
    };

    fetchUserListings();
  }, [user]);

  return (
    <div className="min-h-screen bg-beige p-10">
      {/* Header */}
      <div className="flex justify-between items-center mt-0 mb-8">
        <h1 className="text-3xl font-semibold text-olive-dark">My Listings</h1>
        <button className="bg-olive-dark text-white px-5 py-2 rounded-lg font-medium shadow-md hover:bg-olive transition duration-300">
          + Add New Listing
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white/60 backdrop-blur-md border border-white/30 rounded-2xl p-6 text-center shadow-md">
          <h3 className="text-xl font-semibold text-olive-dark">Total Listings</h3>
          <p className="text-3xl font-bold text-olive-dark mt-2">{stats.total}</p>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center shadow-md">
          <h3 className="text-xl font-semibold text-green-800">Active Listings</h3>
          <p className="text-3xl font-bold text-green-700 mt-2">{stats.active}</p>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center shadow-md">
          <h3 className="text-xl font-semibold text-red-800">Inactive Listings</h3>
          <p className="text-3xl font-bold text-red-700 mt-2">{stats.inactive}</p>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {/* Empty state */}
      {listings.length === 0 && (
        <div className="text-center text-gray-600 mt-20">
          <p>No listings found. Click “Add New Listing” to create one.</p>
        </div>
      )}
    </div>
  );
};

export default Listings;

const ListingCard = ({ listing }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef(null);

  const images = Array.isArray(listing.images) ? listing.images : [listing.images];

  useEffect(() => {
    if (isHovered && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 1500);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isHovered, images]);

  return (
    <div
      className="bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl p-4 shadow-md hover:scale-[1.02] transition duration-300 relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCurrentImageIndex(0);
      }}
    >
      {/* Image Slideshow */}
      <div className="relative w-full h-48 rounded-xl overflow-hidden">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={listing.title}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              idx === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>

      {/* Listing Info */}
      <h3 className="text-lg font-semibold text-olive-dark mt-4">{listing.title}</h3>
      <p className="text-sm text-olive-dark/70 mt-1">{listing.location}</p>
      <p className="text-sm text-olive-dark/90 mt-2 font-medium">₱{listing.price}</p>

      <div className="flex justify-between items-center mt-4">
        <span
          className={`${
            listing.status === "Active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-300 text-gray-700"
          } px-3 py-1 rounded-full text-xs font-medium`}
        >
          {listing.status}
        </span>
        <button className="text-sm font-medium text-olive-dark hover:underline">
          Edit
        </button>
      </div>
    </div>
  );
};
