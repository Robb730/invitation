import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import Navbar from "./homepage-comp/Navbar";
import Footer from "./homepage-comp/Footer";
import { ChevronLeft, ChevronRight, X, Calendar, Tag, MessageCircle, MapPin } from "lucide-react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format, differenceInDays } from "date-fns";
import { PayPalButtons } from "@paypal/react-paypal-js";
import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { isFavorite, toggleFavorite } from "../../utils/favorites";
import { FiShare2 } from "react-icons/fi";
import { serverTimestamp, onSnapshot, orderBy } from "firebase/firestore";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import markerIcon from "./hostpage-comp/images/marker_olive.png"; // you can replace this with your own image
import { updateHostPoints } from "../../utils/pointSystem";

const customMarker = L.icon({
  iconUrl: markerIcon,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const ServicesDetails = () => {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [hostName, setHostName] = useState("Unknown Host");
  const [hostPic, setHostPic] = useState("pic");
  const [selectedIndex, setSelectedIndex] = useState(null);
  
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [user, setUser] = useState("");

  const [favorite, setFavorite] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [showChat, setShowChat] = useState(false);
  const [messageText, setMessageText] = useState("");

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!user || !listing) return;

    const chatId = `${user.id}_${listing.hostId}_${id}`;
    const chatRef = doc(db, "chats", chatId);
    const messagesRef = collection(chatRef, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [user, listing, id]);

  const [bookedDates, setBookedDates] = useState([]);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      key: "selection",
    },
  ]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      const chatId = `${user.id}_${listing.hostId}_${id}`;

      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        // create new chat document
        await setDoc(chatRef, {
          participants: [user.id, listing.hostId],
          listingId: id,
          lastMessage: messageText,
          updatedAt: serverTimestamp(),
        });
      } else {
        // update existing chat's last message and timestamp
        await updateDoc(chatRef, {
          lastMessage: messageText,
          updatedAt: serverTimestamp(),
        });
      }

      // add message to subcollection
      await addDoc(collection(chatRef, "messages"), {
        senderId: user.id,
        text: messageText,
        createdAt: serverTimestamp(),
      });

      setMessageText("");
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message.");
    }
  };

  // Get current page URL for sharing
  const currentURL = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentURL);
    alert("Link copied to clipboard!");
  };
  // 2️⃣ Function to get earliest available date
  const getEarliestAvailableDate = useCallback(() => {
    const today = new Date();
    let start = new Date(today);
    start.setDate(start.getDate() + 1);

    // Skip booked dates
    while (
      bookedDates.some(
        (d) => start.toDateString() === new Date(d).toDateString()
      )
    ) {
      start.setDate(start.getDate() + 1);
    }

    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { startDate: start, endDate: end };
  }, [bookedDates]);

  useEffect(() => {
    if (!bookedDates || bookedDates.length === 0) return;

    const { startDate, endDate } = getEarliestAvailableDate();
    setDateRange([{ startDate, endDate, key: "selection" }]);
  }, [bookedDates, getEarliestAvailableDate]);

  // 4️⃣ Check if a date is booked (used in dayContentRenderer)
  // const isDateBooked = useCallback(
  //   (date) =>
  //     bookedDates.some(
  //       (b) => new Date(b).toDateString() === date.toDateString()
  //     ),
  //   [bookedDates]
  // );

  //check if listing is already your favorite

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (user && id) {
        const fav = await isFavorite(id);
        setFavorite(fav);
      }
    };
    checkFavoriteStatus();
  }, [user, id]);

  // 🔹 Fetch listing info
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const docRef = doc(db, "listings", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setListing(docSnap.data());
      } catch (err) {
        console.error("Error fetching listing:", err);
      }
    };
    fetchListing();
  }, [id]);

  useEffect(() => {
    const checkFav = async () => {
      const fav = await isFavorite(id);
      setFavorite(fav);
    };
    checkFav();
  }, [id]);

  // 🔹 Fetch host info
  useEffect(() => {
    const fetchHostInfo = async () => {
      if (!listing?.hostId) return;
      try {
        const hostRef = doc(db, "users", listing.hostId);
        const hostSnap = await getDoc(hostRef);
        if (hostSnap.exists()) {
          const data = hostSnap.data();
          setHostName(data.fullName || data.name || "Unknown Host");
          setHostPic(data.profilePic || "pic");
        }
      } catch (err) {
        console.error("Error fetching host:", err);
      }
    };
    fetchHostInfo();
  }, [listing]);

  // 🔹 Fetch booked dates
  useEffect(() => {
    const fetchBookedDates = async () => {
      try {
        let allBooked = [];

        // ✅ 1. Get confirmed reservations
        const reservationsRef = collection(db, "reservations");
        const q = query(
          reservationsRef,
          where("listingId", "==", id),
          where("status", "==", "Confirmed")
        );
        const resSnap = await getDocs(q);

        resSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.bookedDate) {
            // for single-day services
            allBooked.push(data.bookedDate);
          } else if (data.checkIn && data.checkOut) {
            // for multi-day stays
            let start = new Date(data.checkIn);
            let end = new Date(data.checkOut);
            while (start <= end) {
              allBooked.push(format(start, "yyyy-MM-dd"));
              start.setDate(start.getDate() + 1);
            }
          }
        });

        // ✅ 2. Get booked dates stored in the listing document
        const listingRef = doc(db, "listings", id);
        const listingSnap = await getDoc(listingRef);
        if (listingSnap.exists()) {
          const listingData = listingSnap.data();
          if (Array.isArray(listingData.bookedDates)) {
            allBooked = [...allBooked, ...listingData.bookedDates];
          }
        }

        // ✅ 3. Remove duplicates
        const uniqueDates = [
          ...new Set(allBooked.map((d) => new Date(d).toDateString())),
        ];

        setBookedDates(uniqueDates.map((d) => new Date(d)));
      } catch (err) {
        console.error("Error fetching booked dates:", err);
      }
    };

    fetchBookedDates();
  }, [id]);

  // 🔹 Get logged in user info
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            setUser({ id: currentUser.uid, ...snap.data() });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!listing) {
    return (
      <>
        <Navbar />
        <div className="mt-24 text-center text-gray-600">Loading...</div>
      </>
    );
  }

  const images = Array.isArray(listing.images)
    ? listing.images
    : [listing.images];
  const listingDetails = `Experience Level: ${listing.bedrooms}`;

  const handlePrev = (e) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const handleNext = (e) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // const isDateBooked = (date) =>
  //   bookedDates.some(
  //     (bookedDate) => date.toDateString() === new Date(bookedDate).toDateString()
  //   );

  // 🔹 Reservation summary trigger
  const handleReserveClick = () => {
    const selectedDate = dateRange[0].startDate;

    if (!auth.currentUser) {
      alert("You must be logged in to book this service.");
      return;
    }

    if (!selectedDate) {
      alert("Please select a date.");
      return;
    }

    setShowSummary(true);
  };

  // 🔹 Apply promo code
  const handleApplyPromo = () => {
    if (
      listing.promoCode &&
      listing.promoCode.toLowerCase() === promoCode.toLowerCase()
    ) {
      setDiscount(listing.discountPercent || 10); // e.g., 10% off if not specified
      alert(`Promo code applied! ${listing.discountPercent || 10}% discount`);
    } else {
      setDiscount(0);
      alert("Invalid promo code for this listing.");
    }
  };

  const { startDate, endDate } = dateRange[0];
  const nights = Math.max(1, differenceInDays(endDate, startDate));
  const subtotal = listing.price * nights;
  const total = discount ? subtotal - subtotal * (discount / 100) : subtotal;

  const handleFavoriteToggle = async () => {
    if (!user) {
      alert("You must be logged in to add to favorites.");
      return;
    }

    try {
      const newState = await toggleFavorite(id); // toggles in Firestore
      setFavorite(newState); // update local state

      if (newState) {
        alert("Added to favorites!");
      } else {
        alert("Removed from favorites.");
      }
    } catch (err) {
      console.error("Error updating favorites:", err);
      alert("Failed to update favorites. Please try again.");
    }
  };

  return (
    <div className="bg-beige min-h-screen">
      <Navbar />

      {/* Image Viewer Modal - Enhanced */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-4 right-4 md:top-6 md:right-8 text-white hover:bg-white/10 p-2 rounded-full transition-all duration-200"
          >
            <X size={28} />
          </button>
          <button
            onClick={handlePrev}
            className="absolute left-2 md:left-5 text-white hover:bg-white/10 p-3 rounded-full transition-all duration-200"
          >
            <ChevronLeft size={32} className="md:w-12 md:h-12" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 md:right-5 text-white hover:bg-white/10 p-3 rounded-full transition-all duration-200"
          >
            <ChevronRight size={32} className="md:w-12 md:h-12" />
          </button>
          <img
            src={images[selectedIndex]}
            alt="Full view"
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-lg animate-[scaleIn_0.3s_ease-out]"
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-20 pt-24 md:pt-28 pb-12 md:pb-20 space-y-6 md:space-y-10">
        {/* Header */}
        <div className="space-y-2 animate-[slideUp_0.6s_ease-out]">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-olive-darker leading-tight">
            {listing.title}
          </h1>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin size={18} className="text-olive-dark flex-shrink-0" />
            <p className="text-base sm:text-lg">{listing.location}</p>
          </div>
        </div>

        {/* Image Grid - Responsive */}
        <div className="animate-[fadeIn_0.8s_ease-out]">
          {/* 1 IMAGE */}
          {images.length === 1 && (
            <div
              className="overflow-hidden rounded-xl md:rounded-2xl cursor-pointer"
              onClick={() => setSelectedIndex(0)}
            >
              <img
                src={images[0]}
                alt=""
                className="w-full h-64 sm:h-96 md:h-[500px] object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}

          {/* 2 IMAGES */}
          {images.length === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl md:rounded-2xl cursor-pointer"
                  onClick={() => setSelectedIndex(i)}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-56 sm:h-72 md:h-[400px] object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          )}

          {/* 3 IMAGES */}
          {images.length === 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
              <div
                className="sm:col-span-2 overflow-hidden rounded-xl md:rounded-2xl cursor-pointer"
                onClick={() => setSelectedIndex(0)}
              >
                <img
                  src={images[0]}
                  alt=""
                  className="w-full h-56 sm:h-72 md:h-[400px] object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="grid grid-rows-2 gap-2 md:gap-3">
                {images.slice(1).map((img, i) => (
                  <div
                    key={i + 1}
                    className="overflow-hidden rounded-xl md:rounded-2xl cursor-pointer"
                    onClick={() => setSelectedIndex(i + 1)}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-28 sm:h-36 md:h-[195px] object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {images.length >= 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
              <div
                className="overflow-hidden rounded-xl md:rounded-2xl cursor-pointer"
                onClick={() => setSelectedIndex(0)}
              >
                <img
                  src={images[0]}
                  alt=""
                  className="w-full h-56 sm:h-72 lg:h-[360px] object-cover hover:scale-105 transition"
                />
              </div>
              <div className="grid grid-rows-2 gap-2 md:gap-3">
                {images.slice(1, 3).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    onClick={() => setSelectedIndex(i + 1)}
                    className="w-full h-28 sm:h-36 lg:h-[175px] object-cover rounded-xl md:rounded-2xl cursor-pointer hover:scale-105 transition"
                  />
                ))}
              </div>
              <div
                className="overflow-hidden rounded-xl md:rounded-2xl cursor-pointer hidden lg:block"
                onClick={() => setSelectedIndex(3)}
              >
                <img
                  src={images[3]}
                  alt=""
                  className="w-full h-[360px] object-cover hover:scale-105 transition"
                />
              </div>
            </div>
          )}
        </div>

        {/* Two-column layout - Responsive */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
          {/* Left Column */}
          <div className="lg:col-span-2 bg-white rounded-2xl md:rounded-3xl p-6 md:p-10 shadow-md border border-gray-100">
            <h3 className="text-2xl md:text-3xl font-bold text-olive-dark mb-4">
              About this service
            </h3>
            <p className="text-gray-800 leading-relaxed text-sm md:text-base">{listingDetails}</p>
            <div className="mt-6 border-t pt-5 text-gray-600 text-sm md:text-base">
              {listing.description}
            </div>

            {/* 📍 Map Section - Mobile Optimized */}
            {listing.latitude && listing.longitude && (
              <div className="mt-10">
                <h3 className="text-xl md:text-2xl font-semibold text-olive-dark mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-olive-dark" />
                  Location
                </h3>
                <div className="rounded-2xl md:rounded-3xl overflow-hidden border border-gray-200 shadow-lg">
                  <MapContainer
                    center={[listing.latitude, listing.longitude]}
                    zoom={14}
                    scrollWheelZoom={false}
                    style={{ height: "300px", width: "100%", zIndex: 0 }}
                    className="md:h-[400px]"
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />
                    <Marker
                      position={[listing.latitude, listing.longitude]}
                      icon={customMarker}
                    >
                      <Popup>
                        <div className="text-center p-2">
                          <h4 className="font-semibold text-olive-dark mb-2 text-sm">
                            {listing.title}
                          </h4>
                          <button
                            onClick={() =>
                              window.open(
                                `https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`,
                                "_blank"
                              )
                            }
                            className="bg-olive-dark text-white px-3 py-1.5 rounded-lg hover:bg-olive-dark/90 transition font-medium text-xs"
                          >
                            Locate
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sticky on Desktop */}
          <div className="space-y-4 md:space-y-5 lg:sticky lg:top-24 lg:self-start">
            {/* 🧑‍💼 Host Info */}
            <div className="bg-white border rounded-xl md:rounded-2xl p-4 md:p-5 shadow-md flex items-center gap-4">
              <img
                src={hostPic}
                alt={hostName}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover ring-2 ring-olive"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-olive-dark text-sm md:text-base">
                  {hostName}
                </h4>
                <p className="text-gray-500 text-xs md:text-sm">Host</p>
              </div>
            </div>

            {/* Message Host Button */}
            {user && user.id !== listing.hostId && (
              <button
                onClick={() => setShowChat(true)}
                className="w-full bg-gradient-to-r from-olive-dark to-olive-darker text-white py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium"
              >
                <MessageCircle size={18} />
                Message Host
              </button>
            )}

            {/* 💳 Reservation Box */}
            <div className="bg-white border rounded-xl md:rounded-2xl p-5 md:p-6 shadow-md space-y-4">
              {/* Price and Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-xl md:text-2xl font-bold text-olive-dark">
                  ₱{listing.price}
                  <span className="text-gray-600 text-sm font-normal">
                    {" "}
                    {listing.priceType}
                  </span>
                </h2>

                <div className="flex items-center gap-2">
                  {/* Favorite Button */}
                  <button
                    onClick={handleFavoriteToggle}
                    className="p-2.5 rounded-full border border-gray-200 hover:border-olive-dark hover:bg-olive-light/10 transition-all duration-200 group"
                    title={
                      favorite ? "Remove from favorites" : "Add to favorites"
                    }
                  >
                    {favorite ? (
                      <AiFillHeart className="text-red-500 text-xl transition-all duration-200" />
                    ) : (
                      <AiOutlineHeart className="text-gray-500 text-xl group-hover:text-olive-dark transition-colors" />
                    )}
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="p-2.5 rounded-full border border-gray-200 hover:border-olive-dark hover:bg-olive-light/10 transition-all duration-200 group"
                    title="Share Listing"
                  >
                    <FiShare2 className="text-gray-500 text-xl group-hover:text-olive-dark transition-colors" />
                  </button>
                </div>
              </div>

              {/* Reserve Button - Full Width */}
              <button
                onClick={handleReserveClick}
                className="w-full bg-gradient-to-r from-olive-dark to-olive-darker text-white font-semibold py-3 md:py-3.5 rounded-xl hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                Reserve
              </button>

              {/* Calendar Button */}
              <div className="border-t pt-4">
                <button
                  onClick={() => setShowCalendar(true)}
                  className="flex items-center justify-center gap-2 w-full bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-xl transition-all duration-200 border border-gray-200"
                >
                  <Calendar size={18} className="text-olive-dark" />
                  <span className="text-sm md:text-base font-medium text-gray-700">
                    {format(dateRange[0].startDate, "MMM dd, yyyy")}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Share Modal - Enhanced Animation */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md relative animate-[slideUp_0.3s_ease-out]">
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-all"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="bg-olive-light/20 p-3 rounded-full">
                  <FiShare2 size={24} className="text-olive-dark" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-olive-dark">
                  Share this listing
                </h3>
              </div>

              <div className="space-y-4">
                {/* Copy Link */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentURL}
                    readOnly
                    className="flex-1 border border-gray-200 px-4 py-3 rounded-xl text-sm bg-gray-50 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-olive-dark text-white px-4 py-3 rounded-xl hover:bg-olive-darker transition-all duration-200 font-medium whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>

                {/* Social Sharing */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-3">
                    Share on social media
                  </p>
                  <div className="flex gap-3">
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                        currentURL
                      )}&quote=${encodeURIComponent(listing.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-[#1877F2] text-white px-4 py-3 rounded-xl hover:opacity-90 transition-all duration-200 text-center font-medium text-sm"
                    >
                      Facebook
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                        currentURL
                      )}&text=${encodeURIComponent(listing.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-[#1DA1F2] text-white px-4 py-3 rounded-xl hover:opacity-90 transition-all duration-200 text-center font-medium text-sm"
                    >
                      Twitter
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Modal - Enhanced */}
        {showChat && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative animate-[slideUp_0.3s_ease-out] flex flex-col max-h-[90vh]">
              <div className="p-4 md:p-6 border-b flex items-center justify-between">
                <h3 className="text-lg md:text-xl font-semibold text-olive-dark">
                  Chat with {hostName}
                </h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 space-y-3 min-h-[300px] max-h-[50vh]">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-gray-500 text-sm">
                      Start your conversation with {hostName}...
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex animate-[slideUp_0.3s_ease-out] ${
                        msg.senderId === user.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`px-4 py-2.5 rounded-2xl max-w-[75%] shadow-sm ${
                          msg.senderId === user.id
                            ? "bg-olive-dark text-white rounded-br-sm"
                            : "bg-white text-gray-800 rounded-bl-sm border border-gray-100"
                        }`}
                      >
                        <p className="text-sm md:text-base break-words">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 md:p-6 border-t bg-white rounded-b-2xl">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-olive-dark focus:border-transparent outline-none transition-all text-sm md:text-base"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-olive-dark text-white px-4 md:px-5 py-3 rounded-xl hover:bg-olive-darker transition-all duration-200 font-medium"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Modal - Enhanced */}
        {showCalendar && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-2xl relative w-full max-w-md animate-[slideUp_0.3s_ease-out]">
              <button
                onClick={() => setShowCalendar(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-all z-10"
              >
                <X size={20} />
              </button>

              <h3 className="text-lg md:text-xl font-semibold text-olive-dark mb-4 text-center">
                Select Dates
              </h3>

              <div className="overflow-x-auto">
                <DateRange
                  ranges={dateRange}
                  onChange={(item) => {
                    const selectedDate = item.selection.startDate;

                    // Check if selected date is booked
                    const isBooked = bookedDates.some(
                      (b) =>
                        new Date(b).toDateString() === selectedDate.toDateString()
                    );

                    if (isBooked) {
                      alert(
                        "❌ This date is already booked. Please select another date."
                      );
                      return;
                    }

                    // Force single-day booking
                    setDateRange([
                      {
                        startDate: selectedDate,
                        endDate: selectedDate,
                        key: "selection",
                      },
                    ]);
                  }}
                  showDateDisplay={false}
                  minDate={new Date()}
                  rangeColors={["#556B2F"]}
                  disabledDates={bookedDates.map((d) => new Date(d))}
                />
              </div>

              <div className="text-center mt-4">
                <button
                  onClick={() => setShowCalendar(false)}
                  className="w-full bg-olive-dark text-white px-6 py-3 rounded-xl hover:bg-olive-darker transition-all duration-200 font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reservation Summary Modal - Enhanced */}
        {showSummary && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 px-4 animate-[fadeIn_0.2s_ease-out] py-10">
            <div
              className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative animate-[slideUp_0.3s_ease-out]"
              style={{
                maxHeight: "85vh",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <button
                onClick={() => setShowSummary(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-all"
              >
                <X size={20} />
              </button>

              <h3 className="text-2xl font-bold text-olive-dark mb-6 pr-8">
                Booking Summary
              </h3>

              <div
                className="space-y-4 mb-6 overflow-y-auto pr-1"
                style={{ maxHeight: "65vh" }}
              >
                {/* Guest Info */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Guest Name</span>
                    <span className="font-medium text-gray-800">
                      {user.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium text-gray-800">
                      {user.email}
                    </span>
                  </div>
                </div>

                {/* Date */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Booked Date</span>
                    <span className="font-medium text-gray-800">
                      {format(startDate, "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Price {listing.priceType}
                    </span>
                    <span className="font-medium text-gray-800">
                      ₱{listing.price}
                    </span>
                  </div>
                </div>

                {/* Promo Code */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Tag
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter promo code"
                      className="w-full border border-gray-200 pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-olive-dark focus:border-transparent outline-none transition-all text-sm"
                    />
                  </div>
                  <button
                    onClick={handleApplyPromo}
                    className="bg-olive-dark text-white px-5 py-3 rounded-xl hover:bg-olive-darker transition-all duration-200 font-medium whitespace-nowrap"
                  >
                    Apply
                  </button>
                </div>

                {discount > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 animate-[slideUp_0.3s_ease-out]">
                    <p className="text-green-700 font-medium text-sm">
                      Discount Applied: {discount}% off
                    </p>
                  </div>
                )}

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">
                      Total Amount
                    </span>
                    <span className="text-2xl font-bold text-olive-dark">
                      ₱{total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t">
                <PayPalButtons
                  style={{ layout: "vertical", color: "gold" }}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      purchase_units: [
                        {
                          amount: {
                            currency_code: "PHP",
                            value: total.toFixed(2),
                          },
                          description: listing.title,
                        },
                      ],
                    });
                  }}
                  onApprove={async (data, actions) => {
                    const order = await actions.order.capture();

                    try {
                      await addDoc(collection(db, "reservations"), {
                        listingId: id,
                        guestId: auth.currentUser.uid,
                        hostId: listing.hostId,
                        bookedDate: format(startDate, "yyyy-MM-dd"),
                        
                        totalAmount: Number( discount
                          ? listing.price - listing.price * (discount / 100)
                          : listing.price),
                        discountApplied: discount,
                        paymentId: order.id,
                        paymentStatus: order.status,
                        status: "Confirmed",
                        createdAt: new Date(),
                      });

                      const hostRef = doc(db, "users", listing.hostId);
                      const hostSnap = await getDoc(hostRef);
                      console.log("hostRef: ", hostRef);

                      if (hostSnap.exists()) {
                        const hostData = hostSnap.data();
                        const currentEwallet = hostData.ewallet;

                        await updateDoc(hostRef, {
                          ewallet: currentEwallet + total,
                        });
                      }

                      console.log("email sent to: " + user.email);
                      await axios.post(
                        "https://custom-email-backend.onrender.com/send-reservation-receipt-services",
                        {
                          guestEmail: user.email,
                          guestName: user.name,
                          listingTitle: listing.title,
                          hostName: hostName,
                          bookedDate: format(startDate, "MMM dd, yyyy"),
                          totalAmount: total,
                          reservationId: order.id,
                        },
                        {
                          headers: {
                            "Content-Type": "application/json",
                          },
                        }
                      );

                      alert("Reservation confirmed and payment successful!");
                      updateHostPoints(listing.hostId, 20);

                      setShowSummary(false);
                    } catch (err) {
                      console.error("Error saving reservation:", err);
                      alert("Error saving reservation after payment.");
                    }
                  }}
                  onError={(err) => {
                    console.error("PayPal error:", err);
                    alert("Payment failed. Please try again.");
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ServicesDetails;
