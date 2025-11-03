/* --- PAGINATION COMPONENT --- */
import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../../firebaseConfig";
import { getAuth } from "firebase/auth";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { isFavorite, toggleFavorite } from "../../../utils/favorites";
import { Home, Sun, Wrench } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";


/* --- SlideshowCard --- */
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
    setFavMessage(
      newState ? "Added to Favorites ❤️" : "Removed from Favorites 💔"
    );
    setShowModal(true);
    setTimeout(() => setShowModal(false), 1500);
  };

  return (
    <div
      className="relative w-full max-w-[420px] bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCurrentImageIndex(0);
      }}
      onClick={() => onListingClick(listing.id)}
    >
      {/* --- Image --- */}
      <div className="h-52 sm:h-60 relative overflow-hidden rounded-t-2xl">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={images[currentImageIndex]}
            alt={listing.title}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              duration: 1.5,
              ease: [0.25, 0.1, 0.25, 1], // smooth cubic-bezier curve
            }}
            className="absolute w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all duration-300"
        >
          {favorite ? (
            <AiFillHeart className="text-olive-dark text-xl" />
          ) : (
            <AiOutlineHeart className="text-gray-600 text-xl" />
          )}
        </button>
      </div>

      {/* --- Details --- */}
      <div className="p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-olive-dark truncate">
            {listing.title}
          </h3>
          <p className="text-gray-500 text-sm mt-1 truncate">
            {listing.location}
          </p>
          {listing.hostName && (
            <p className="text-xs text-gray-600 mt-2 italic truncate">
              Hosted by{" "}
              <span className="font-medium text-olive-dark">
                {listing.hostName}
              </span>
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-lg font-bold text-olive-dark">
            ₱{listing.price}
            <span className="text-gray-500 font-medium text-sm">
              {" "}
              / {listing.priceType}
            </span>
          </p>
          <button className="bg-olive-dark text-white text-xs sm:text-sm px-4 py-2.5 rounded-full hover:bg-olive transition-all duration-300">
            View Details
          </button>
        </div>
      </div>

      {/* --- Modal --- */}
      {showModal && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white px-5 py-3 rounded-xl shadow-lg text-olive-dark font-medium">
            {favMessage}
          </div>
        </div>
      )}
    </div>
  );
};

/* --- Category Section (modern layout) --- */
const CategorySection = ({ title, listings, onListingClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const listingsPerPage = 6;
  const totalPages = Math.ceil(listings.length / listingsPerPage);
  const startIndex = (currentPage - 1) * listingsPerPage;
  const currentListings = listings.slice(
    startIndex,
    startIndex + listingsPerPage
  );

  if (listings.length === 0) return null;

  return (
    <div className="w-full mb-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 sm:px-14 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-charcoal flex items-center gap-3">
          {title}
        </h2>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                  currentPage === index + 1
                    ? "bg-olive-dark text-white shadow-md"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-4 sm:px-10 justify-items-center">
        {currentListings.map((listing) => (
          <SlideshowCard
            key={listing.id}
            listing={listing}
            onListingClick={onListingClick}
          />
        ))}
      </div>

      {/* Bottom Pagination (for mobile usability) */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-10 gap-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`px-3 py-1.5 rounded-full font-semibold text-sm transition-all duration-300 ${
                currentPage === index + 1
                  ? "bg-olive-dark text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* --- Main Pagination Component --- */
const Pagination = () => {
  const [listings, setListings] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollTo) {
      const section = document.getElementById(location.state.scrollTo);
      if (section) {
        setTimeout(() => {
          section.scrollIntoView({ behavior: "smooth" });
        }, 1500); // delay to wait for page render
      }
    }
  }, [location]);

  const handleListingClick = (id) => {
    const user = getAuth().currentUser;
    user ? navigate(`/homes/${id}`) : navigate("/login");
  };
  const handleExperiencesClick = (id) => {
    const user = getAuth().currentUser;
    user ? navigate(`/experiences/${id}`) : navigate("/login");
  };
  const handleServicesClick = (id) => {
    const user = getAuth().currentUser;
    user ? navigate(`/services/${id}`) : navigate("/login");
  };

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const listingsRef = collection(db, "listings");
        const q = query(listingsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = await Promise.all(
          snapshot.docs.map(async (d) => {
            const l = { id: d.id, ...d.data() };
            if (l.hostId) {
              const h = await getDoc(doc(db, "users", l.hostId));
              l.hostName = h.exists()
                ? h.data().fullName || h.data().name || "Unknown Host"
                : "Unknown Host";
            }
            return l;
          })
        );
        setListings(data.filter((l) => l.status === "Active"));
      } catch (err) {
        console.error("Error fetching listings:", err);
      }
    };
    fetchListings();
  }, []);

  const homes = listings.filter((l) => l.superCategory === "Homes");
  const experiences = listings.filter((l) => l.superCategory === "Experiences");
  const services = listings.filter((l) => l.superCategory === "Services");

  return (
    <div className="w-full bg-beige min-h-screen py-10 space-y-12">
      <CategorySection
        title={
          <div className="flex items-center gap-2 text-olive-dark" id="homes-section">
            <Home size={26} strokeWidth={2.5} />
            <span>Homes</span>
          </div>
        }
        listings={homes}
        onListingClick={handleListingClick}
      />

      <CategorySection
        title={
          <div className="flex items-center gap-2 text-olive-dark" id="experiences-section">
            <Sun size={26} strokeWidth={2.5} />
            <span>Experiences</span>
          </div>
        }
        listings={experiences}
        onListingClick={handleExperiencesClick}
      />

      <CategorySection
        title={
          <div className="flex items-center gap-2 text-olive-dark" id="services-section">
            <Wrench size={26} strokeWidth={2.5} />
            <span>Services</span>
          </div>
        }
        listings={services}
        onListingClick={handleServicesClick}
      />
    </div>
  );
};

export default Pagination;
