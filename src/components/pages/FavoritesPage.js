import React, { useEffect, useState } from "react";
import Navbar from "./homepage-comp/Navbar";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { isFavorite, toggleFavorite } from "../../utils/favorites";
import { useNavigate } from "react-router-dom";

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [favStates, setFavStates] = useState({}); // track favorite state per listing
  const navigate = useNavigate();

  // Track logged-in user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleViewListing = async (listingId) => {
    try {
      const listingRef = doc(db, "listings", listingId);
      const listingSnap = await getDoc(listingRef);

      if (listingSnap.exists()) {
        const listingData = { id: listingSnap.id, ...listingSnap.data() };

        if (listingData.superCategory === "Homes") {
          navigate(`/homes/${listingId}`);
        } else if (listingData.superCategory === "Experiences") {
          navigate(`/experiences/${listingId}`);
        } else if (listingData.superCategory === "Services") {
          navigate(`/services/${listingId}`);
        } else {
          console.error("Unknown superCategory:", listingData.superCategory);
        }
      } else {
        console.error("No such listing!");
      }
    } catch (error) {
      console.error("Error fetching listing:", error);
    }
  };

  // Fetch favorite listings
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const favRef = collection(db, "favorites");
        const q = query(favRef, where("userId", "==", user.uid));
        const favSnapshot = await getDocs(q);

        const favListings = await Promise.all(
          favSnapshot.docs.map(async (docSnap) => {
            const listingRef = doc(db, "listings", docSnap.data().listingId);
            const listingSnap = await getDoc(listingRef);
            if (listingSnap.exists()) {
              return { id: listingSnap.id, ...listingSnap.data() };
            }
            return null;
          })
        );

        const validListings = favListings.filter(Boolean);
        setFavorites(validListings);

        // Initialize favorite states for each listing
        const states = {};
        for (const listing of validListings) {
          const fav = await isFavorite(listing.id);
          states[listing.id] = fav;
        }
        setFavStates(states);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      }
      setLoading(false);
    };

    fetchFavorites();
  }, [user]);

  // Toggle favorite for a listing
  const handleFavoriteToggle = async (listingId) => {
    if (!user) {
      alert("You must be logged in to toggle favorites.");
      return;
    }

    try {
      const newState = await toggleFavorite(listingId); // toggles in Firestore
      setFavStates((prev) => ({ ...prev, [listingId]: newState }));

      if (!newState) {
        // Optionally remove from favorites page immediately if unfavorited
        setFavorites((prev) => prev.filter((l) => l.id !== listingId));
        alert("Removed from Favorites");
      }
    } catch (err) {
      console.error("Error updating favorites:", err);
      alert("Failed to update favorites. Please try again.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 px-5 sm:px-10 py-24">
        <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
          My Favorites
        </h1>

        {loading ? (
          <p className="text-gray-500 text-center">Loading favorites...</p>
        ) : favorites.length === 0 ? (
          <div className="text-center mt-20">
            <AiFillHeart className="text-6xl text-olive mx-auto mb-4 animate-pulse" />
            <p className="text-gray-500 text-lg">
              You haven’t added any favorites yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden relative"
              >
                <div className="relative w-full h-56 overflow-hidden">
                  <img
                    src={listing.images?.[0] || "/placeholder.jpg"}
                    alt={listing.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <button
                    onClick={() => handleFavoriteToggle(listing.id)}
                    className="absolute top-3 right-3 bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition"
                  >
                    {favStates[listing.id] ? (
                      <AiFillHeart className="text-olive text-xl" />
                    ) : (
                      <AiOutlineHeart className="text-gray-500 text-xl" />
                    )}
                  </button>
                </div>

                <div className="p-4 flex flex-col gap-y-2">
                  <h2 className="text-lg font-semibold text-gray-800 line-clamp-1">
                    {listing.title}
                  </h2>
                  <p className="text-sm text-gray-500 line-clamp-1">
                    {listing.location || "Unknown Location"}
                  </p>
                  <p className="text-base font-bold text-gray-800 mt-2">
                    ₱{listing.price} /{" "}
                    <span className="font-medium text-gray-500">
                      {listing.priceType}
                    </span>
                  </p>
                  <button
                    onClick={() => {handleViewListing(listing.id)}} // navigate to listing details
                    className="mt-3 bg-olive-dark text-beige font-semibold px-4 py-2 rounded-xl text-sm hover:bg-olive transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    View Listing
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default FavoritesPage;
