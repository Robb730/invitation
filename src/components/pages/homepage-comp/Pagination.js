import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

// 🔹 SlideshowCard (same as before, slightly improved)
// 🔹 SlideshowCard (modern layout)

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
      className="bg-white w-[440px] rounded-2xl shadow-lg hover:shadow-2xl hover:scale-[1.03] duration-300 overflow-hidden cursor-pointer flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCurrentImageIndex(0);
      }}
    >
      {/* Image Section */}
      <div className="h-[220px] w-full overflow-hidden">
        <img
          src={images[currentImageIndex]}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-500"
        />
      </div>

      {/* Info Section */}
      <div className="flex flex-col justify-between p-4 flex-grow">
        <div>
          <h3 className="text-lg font-semibold text-olive-dark leading-tight">
            {listing.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{listing.location}</p>
          {listing.hostName && (
            <p className="text-xs text-gray-600 mt-2 italic">
              Hosted by <span className="font-medium text-olive-dark">{listing.hostName}</span>
            </p>
          )}
        </div>
        

        <div className="flex items-center justify-between mt-4">
          <p className="text-lg font-bold text-olive-dark">₱{listing.price}</p>
          <button
            onClick={() => onListingClick(listing.id)}
            className="bg-olive-dark text-white text-sm px-4 py-2 rounded-full hover:bg-olive duration-300"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};


// 🔹 Pagination (main component)
const Pagination = ({ onListingClick }) => {
  const [listings, setListings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const listingsPerPage = 6;

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const listingsRef = collection(db, "listings");
        const q = query(listingsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const listingsWithHosts = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const listing = { id: docSnap.id, ...docSnap.data() };

            // 🔍 Look up the host's name in the "users" collection using hostID
            if (listing.hostId) {
              const hostRef = doc(db, "users", listing.hostId);
              const hostSnap = await getDoc(hostRef);
              if (hostSnap.exists()) {
                const hostData = hostSnap.data();
                listing.hostName = hostData.fullName || hostData.name || "Unknown Host";
              } else {
                listing.hostName = "Unknown Host";
              }
            } else {
              listing.hostName = "Unknown Host";
            }
            

            return listing;
          }))

        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const activeListings = listingsWithHosts.filter(listing => listing.status === "Active");
        setListings(activeListings);
        
      } catch (error) {
        console.error("Error fetching listings:", error);
      }
    };
    fetchListings();
  }, []);

  // 🔸 Pagination logic
  const totalPages = Math.ceil(listings.length / listingsPerPage);
  const startIndex = (currentPage - 1) * listingsPerPage;
  const currentListings = listings.slice(
    startIndex,
    startIndex + listingsPerPage
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center px-14 py-4">
        <h1 className="text-2xl font-semibold">Popular</h1>
      </div>

      {/* Listings grid (3 columns × 2 rows) */}
      {/* Listings grid (3 columns, 2 rows) */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 px-10 py-6 justify-items-center">
  {currentListings.length > 0 ? (
    currentListings.map((listing) => (
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


      {/* Pagination buttons */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 py-6">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-4 py-2 rounded-full font-semibold ${
                currentPage === index + 1
                  ? "bg-olive-dark text-white"
                  : "bg-gray-300 text-gray-700 hover:bg-gray-400"
              } transition-all duration-300`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Pagination;
