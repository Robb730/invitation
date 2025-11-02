import React, { useEffect, useState, useRef, useMemo } from "react";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../../firebaseConfig";
import { getAuth } from "firebase/auth";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { isFavorite, toggleFavorite } from "../../../utils/favorites";

// --- SlideshowCard Component (unchanged)
const SlideshowCard = ({ listing, onListingClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [favMessage, setFavMessage] = useState("");
  const intervalRef = useRef(null);

  const images = useMemo(() => {
    return Array.isArray(listing.images) ? listing.images : [listing.images];
  }, [listing.images]);

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

  useEffect(() => {
    const checkFav = async () => {
      const fav = await isFavorite(listing.id);
      setFavorite(fav);
    };
    checkFav();
  }, [listing.id]);

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    const newState = await toggleFavorite(listing.id);
    setFavorite(newState);
    setFavMessage(newState ? "Added to Favorites" : "Removed from Favorites");
    setShowModal(true);
    setTimeout(() => setShowModal(false), 1500);
  };

  return (
    <div
      className="relative bg-white w-full max-w-[440px] rounded-2xl shadow-md hover:shadow-xl hover:scale-[1.02] duration-300 overflow-hidden cursor-pointer flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCurrentImageIndex(0);
      }}
    >
      <div className="h-48 sm:h-56 md:h-60 w-full overflow-hidden relative">
        <img
          src={images[currentImageIndex]}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-500"
        />

        {isHovered && (
          <button
            onClick={handleFavoriteClick}
            className="absolute top-3 right-3 bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition"
          >
            {favorite ? (
              <AiFillHeart className="text-olive text-xl" />
            ) : (
              <AiOutlineHeart className="text-gray-500 text-xl" />
            )}
          </button>
        )}
      </div>

      <div className="flex flex-col justify-between p-3 sm:p-4 flex-grow">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-olive-dark leading-tight line-clamp-1">
            {listing.title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-1">
            {listing.location}
          </p>
          {listing.hostName && (
            <p className="text-xs text-gray-600 mt-2 italic line-clamp-1">
              Hosted by{" "}
              <span className="font-medium text-olive-dark">
                {listing.hostName}
              </span>
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-base sm:text-lg font-bold text-olive-dark">
            ₱{listing.price} /{" "}
            <span className="font-medium text-gray-500 text-base">
              {listing.priceType}
            </span>
          </p>
          <button
            onClick={() => onListingClick(listing.id)}
            className="bg-olive-dark text-white text-xs sm:text-sm px-3 py-2 rounded-full hover:bg-olive duration-300"
          >
            View Details
          </button>
        </div>
      </div>

      {showModal && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white px-6 py-3 rounded-lg shadow-md text-olive-dark font-semibold">
            {favMessage}
          </div>
        </div>
      )}
    </div>
  );
};

// --- CategorySection Component (unchanged)
const CategorySection = ({ title, listings, onListingClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const listingsPerPage = 6;
  const totalPages = Math.ceil(listings.length / listingsPerPage);
  const startIndex = (currentPage - 1) * listingsPerPage;
  const currentListings = listings.slice(startIndex, startIndex + listingsPerPage);

  if (listings.length === 0) return null;

  return (
    <div className="w-full mb-10">
      {/* 🔹 Header + Pagination inline */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 sm:px-14 py-4">
        <h1 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-0">{title}</h1>

        {/* Pagination Buttons (top-right) */}
        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2 sm:gap-3">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 ${
                  currentPage === index + 1
                    ? "bg-olive-dark text-white"
                    : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 🔹 Listings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-10 py-6 justify-items-center">
        {currentListings.map((listing) => (
          <SlideshowCard
            key={listing.id}
            listing={listing}
            onListingClick={onListingClick}
          />
        ))}
      </div>
    </div>
  );
};


// --- Main Pagination Component
const Pagination = () => {
  const [listings, setListings] = useState([]);
  const navigate = useNavigate();

  const handleListingClick = (listingId) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      navigate(`/room/${listingId}`);
    } else {
      alert("Please log in to view listing details.");
      navigate("/login");
    }
  };

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const listingsRef = collection(db, "listings");
        const q = query(listingsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const listingsWithHosts = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const listing = { id: docSnap.id, ...docSnap.data() };

            if (listing.hostId) {
              try {
                const hostRef = doc(db, "users", listing.hostId);
                const hostSnap = await getDoc(hostRef);
                listing.hostName = hostSnap.exists()
                  ? hostSnap.data().fullName || hostSnap.data().name || "Unknown Host"
                  : "Unknown Host";
              } catch {
                listing.hostName = "Unknown Host";
              }
            } else {
              listing.hostName = "Unknown Host";
            }

            return listing;
          })
        );

        const activeListings = listingsWithHosts.filter(
          (listing) => listing.status === "Active"
        );

        setListings(activeListings);
      } catch (error) {
        console.error("Error fetching listings:", error);
      }
    };

    fetchListings();
  }, []);

  const homes = listings.filter((l) => l.superCategory === "Homes");
  const experiences = listings.filter((l) => l.superCategory === "Experiences");
  const services = listings.filter((l) => l.superCategory === "Services");

  return (
    <div className="w-full">
      <section id="homes-section">
        <CategorySection title="Homes" listings={homes} onListingClick={handleListingClick} />
      </section>

      <section id="experiences-section">
        <CategorySection title="Experiences" listings={experiences} onListingClick={handleListingClick} />
      </section>

      <section id="services-section">
        <CategorySection title="Services" listings={services} onListingClick={handleListingClick} />
      </section>
    </div>
  );
};

export default Pagination;
