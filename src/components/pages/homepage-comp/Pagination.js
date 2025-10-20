import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

const Pagination = ({ onListingClick }) => {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const listingsRef = collection(db, "listings");
        const q = query(listingsRef, orderBy("createdAt", "desc"), limit(3));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setListings(data);
      } catch (error) {
        console.error("Error fetching listings:", error);
      }
    };
    fetchListings();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center px-14 py-4">
        <h1 className="text-2xl font-semibold">Popular</h1>
        <div className="ml-auto flex gap-2">
          <button className="text-beige font-semibold bg-gray-400 rounded-full w-10 h-10 flex items-center justify-center">
            &lt;
          </button>
          <button className="text-beige font-semibold bg-gray-400 rounded-full w-10 h-10 flex items-center justify-center">
            &gt;
          </button>
        </div>
      </div>

      {/* Listings */}
      <div className="flex justify-center items-center mt-5 mb-10 gap-12">
        {listings.length > 0 ? (
          listings.map((listing) => (
            <SlideshowCard
              key={listing.id}
              listing={listing}
              onListingClick={onListingClick}
            />
          ))
        ) : (
          <p className="text-gray-500 text-center w-full mt-10">
            No listings found.
          </p>
        )}
      </div>
    </div>
  );
};

export default Pagination;

// 🔸 SlideshowCard (image fully visible, text below)
const SlideshowCard = ({ listing, onListingClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef(null);

  const images = Array.isArray(listing.images)
    ? listing.images
    : [listing.images];

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
      className="w-3/12 rounded-3xl shadow-2xl overflow-hidden hover:scale-110 duration-500 bg-white"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCurrentImageIndex(0);
      }}
    >
      {/* Image section */}
      <div className="w-full h-56 overflow-hidden">
        <img
          src={images[currentImageIndex]}
          alt={listing.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info section (below the image) */}
      <div className="p-3 flex items-start justify-between">
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-olive-dark">
            {listing.title}
          </div>
          <div className="text-xs text-gray-500 mt-1">{listing.location}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-sm font-bold text-olive-dark">
            ₱{listing.price}
          </div>
          <button
            onClick={() => onListingClick(listing.id)}
            className="bg-olive-dark px-2 py-1 rounded-full text-xs text-beige"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};
