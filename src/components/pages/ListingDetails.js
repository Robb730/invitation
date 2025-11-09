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
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Tag,
  Users,
  Bed,
  Bath,
  MapPin,
  Star,
  Heart,
  Share2,
  MessageCircle,
  Send,
  Check,
} from "lucide-react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format, differenceInDays } from "date-fns";
import { PayPalButtons } from "@paypal/react-paypal-js";
import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import { isFavorite, toggleFavorite } from "../../utils/favorites";
import { serverTimestamp, onSnapshot, orderBy } from "firebase/firestore";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import markerIcon from "./hostpage-comp/images/marker_olive.png";
import { updateHostPoints } from "../../utils/pointSystem";
import { addNotification } from "../../utils/notificationSystem";

const customMarker = L.icon({
  iconUrl: markerIcon,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const ListingDetails = () => {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [hostName, setHostName] = useState("Unknown Host");
  const [hostPic, setHostPic] = useState("pic");
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [guestCount, setGuestCount] = useState(1);
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
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const [hostTier, setHostTier] = useState("Bronze");

  const [validCodes, setValidCodes] = useState([]);
  const [matchedCode, setMatchedCode] = useState(false);

  const [bookedDates, setBookedDates] = useState([]);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      key: "selection",
    },
  ]);

  // Fetch ratings
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const ratingsRef = collection(db, "ratings");
        const q = query(ratingsRef, where("listingId", "==", id));
        const snapshot = await getDocs(q);
        const allRatings = snapshot.docs.map((doc) => doc.data());

        const ratingsWithComments = allRatings.filter(
          (r) => r.comment && r.comment.trim() !== ""
        );

        const avg =
          allRatings.length > 0
            ? allRatings.reduce((sum, r) => sum + (r.rating || 0), 0) /
              allRatings.length
            : 0;

        setRatings({
          all: allRatings,
          withComments: ratingsWithComments,
        });
        setAverageRating(avg);
      } catch (err) {
        console.error("Error fetching ratings:", err);
      }
    };
    fetchRatings();
  }, [id]);

  // Chat listener
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

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      const chatId = `${user.id}_${listing.hostId}_${id}`;
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participants: [user.id, listing.hostId],
          listingId: id,
          lastMessage: messageText,
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(chatRef, {
          lastMessage: messageText,
          updatedAt: serverTimestamp(),
        });
      }

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

  const currentURL = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentURL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getEarliestAvailableDate = useCallback(() => {
    const today = new Date();
    let start = new Date(today);
    start.setDate(start.getDate() + 1);

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

  const isDateBooked = useCallback(
    (date) =>
      bookedDates.some(
        (b) => new Date(b).toDateString() === date.toDateString()
      ),
    [bookedDates]
  );

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (user && id) {
        const fav = await isFavorite(id);
        setFavorite(fav);
      }
    };
    checkFavoriteStatus();
  }, [user, id]);

  // Fetch listing
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

  // Fetch host info
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
          //fetch host tier

          const hostTier = doc(db, "hostPoints", listing.hostId);
          const hostTierSnap = await getDoc(hostTier);
          if (hostTierSnap.exists()) {
            const tierData = hostTierSnap.data();
            setHostTier(tierData.tier || "Bronze");
          }
        }
      } catch (err) {
        console.error("Error fetching host:", err);
      }
    };
    fetchHostInfo();
  }, [listing]);

  // Fetch booked dates
  useEffect(() => {
    const fetchBookedDates = async () => {
      try {
        const bookingsRef = collection(db, "reservations");
        const q = query(
          bookingsRef,
          where("listingId", "==", id),
          where("status", "==", "Confirmed")
        );
        const snapshot = await getDocs(q);
        const booked = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          let start = new Date(data.checkIn);
          let end = new Date(data.checkOut);
          while (start <= end) {
            booked.push(new Date(start));
            start.setDate(start.getDate() + 1);
          }
        });
        setBookedDates(booked);
      } catch (err) {
        console.error("Error fetching booked dates:", err);
      }
    };
    fetchBookedDates();
  }, [id]);

  useEffect(() => {
  const fetchRewardCodes = async () => {
    try {
      const q = query(
        collection(db, "rewards"),
        where("type", "==", "reservation-discount")
      );
      const snap = await getDocs(q);

      const codes = snap.docs.flatMap((docSnap) => {
        const data = docSnap.data();
        return (data.codes || [])
          .filter(c => !c.used) // only unused codes
          .map(c => ({
            ...c,
            code: c.code.toLowerCase(),
            discount: data.discount, // attach parent discount
            rewardId: docSnap.id,
          }));
      });

      setValidCodes(codes);
    } catch (error) {
      console.error(error);
    }
  };

  fetchRewardCodes();
}, []);


// This function should be called after the reservation/payment is confirmed
const markCodeAsUsed = async (matchedCodeObj) => {
  if (!matchedCodeObj) return;

  try {
    const docRef = doc(db, "rewards", matchedCodeObj.rewardId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return;

    const data = docSnap.data();

    // Find the code in the codes array
    const codeIndex = data.codes.findIndex(
      (c) => c.code.toLowerCase() === matchedCodeObj.code
    );

    if (codeIndex === -1) return;

    const updatedCodes = [...data.codes];
    updatedCodes[codeIndex] = {
      ...updatedCodes[codeIndex],
      used: true,
    };

    await updateDoc(docRef, { codes: updatedCodes });

    // Update local validCodes state to remove the used code
    setValidCodes((prev) =>
      prev.filter((c) => c.code.toLowerCase() !== matchedCodeObj.code)
    );

    console.log("Promo code marked as used.");
  } catch (error) {
    console.error("Failed to mark promo code as used:", error);
  }
};

  // Get user
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

  const handlePrev = (e) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleReserveClick = () => {
    const { startDate, endDate } = dateRange[0];
    if (!auth.currentUser) {
      alert("You must be logged in to make a reservation.");
      return;
    }
    if (!startDate || !endDate) {
      alert("Please select valid dates.");
      return;
    }
    if (format(startDate, "MMM dd, yyyy") === format(endDate, "MMM dd, yyyy")) {
      alert("Check-out date must be after check-in date.");
      return;
    }
    setShowSummary(true);
  };

  const handleApplyPromo = () => {
    const matchedCodeObj = validCodes.find(c => c.code === promoCode.toLowerCase());
    

    if (
      (listing.promoCode &&
        listing.promoCode.toLowerCase() === promoCode.toLowerCase()) ||
      matchedCodeObj
    ) {
      console.log(matchedCodeObj.discount);

      const appliedDiscount = matchedCodeObj ? matchedCodeObj.discount : listing.discountPercent || 10;
        
      setDiscount(appliedDiscount);
      setMatchedCode(matchedCodeObj);
      alert(`Promo code applied! ${appliedDiscount || 10}% discount`);
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
      const newState = await toggleFavorite(id);
      setFavorite(newState);

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
            {/* About Section */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h3 className="text-2xl md:text-3xl font-bold text-olive-dark">
                  About this place
                </h3>
                {averageRating > 0 && (
                  <span className="bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-medium shadow-sm border border-yellow-100 w-fit">
                    <Star size={16} fill="currentColor" />
                    {averageRating.toFixed(1)}
                    <span className="text-gray-500 text-xs">
                      ({ratings.all?.length || 0})
                    </span>
                  </span>
                )}
              </div>

              {/* Property Details - Mobile Optimized */}
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-2 bg-gradient-to-br from-olive-light/20 to-olive-light/10 rounded-xl px-4 py-2.5 border border-olive-light/30 shadow-sm">
                  <Users size={18} className="text-olive-dark" />
                  <span className="text-sm md:text-base font-medium text-gray-800">
                    {listing.guests} guest{listing.guests > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-gradient-to-br from-olive-light/20 to-olive-light/10 rounded-xl px-4 py-2.5 border border-olive-light/30 shadow-sm">
                  <Bed size={18} className="text-olive-dark" />
                  <span className="text-sm md:text-base font-medium text-gray-800">
                    {listing.bedrooms} bedroom{listing.bedrooms > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-gradient-to-br from-olive-light/20 to-olive-light/10 rounded-xl px-4 py-2.5 border border-olive-light/30 shadow-sm">
                  <Bath size={18} className="text-olive-dark" />
                  <span className="text-sm md:text-base font-medium text-gray-800">
                    {listing.bathrooms} bath{listing.bathrooms > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl p-4 md:p-5 shadow-inner">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm md:text-base">
                  {listing.description}
                </p>
              </div>
            </div>

            {/* Map Section - Mobile Optimized */}
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
                            Open in Google Maps
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            )}

            {/* Ratings Section - Mobile Optimized */}
            {ratings.all?.length > 0 && (
              <div className="mt-10 md:mt-14">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <h3 className="text-2xl md:text-3xl font-bold text-olive-dark flex items-center gap-3">
                    <Star
                      size={24}
                      className="text-yellow-500"
                      fill="currentColor"
                    />
                    Reviews
                  </h3>
                  <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-100 px-4 py-1.5 rounded-full text-yellow-600 font-medium shadow-sm w-fit">
                    {averageRating.toFixed(1)} ★
                    <span className="text-gray-500 text-sm">
                      ({ratings.all.length})
                    </span>
                  </div>
                </div>

                {ratings.withComments.length > 0 ? (
                  <div className="grid gap-4 md:gap-5">
                    {ratings.withComments.map((r, i) => (
                      <div
                        key={i}
                        className="bg-white border border-gray-100 rounded-xl md:rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-lg transition-all duration-200 animate-[slideUp_0.4s_ease-out]"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-olive-light/30 text-olive-dark font-semibold w-10 h-10 rounded-full flex items-center justify-center uppercase flex-shrink-0">
                              {r.guestName?.charAt(0) || "G"}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 text-sm md:text-base">
                                {r.guestName || "Guest"}
                              </p>
                              <div className="flex text-yellow-400 text-sm">
                                {"★".repeat(r.rating)}
                                <span className="text-gray-300">
                                  {"★".repeat(5 - r.rating)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className="text-xs md:text-sm text-gray-500 font-medium whitespace-nowrap">
                            {r.createdAt?.toDate
                              ? r.createdAt.toDate().toLocaleDateString()
                              : new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-gray-700 text-sm md:text-base italic leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                          "{r.comment}"
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic bg-gray-50 border border-gray-100 rounded-xl p-4 text-center text-sm md:text-base">
                    No written reviews yet — but this listing has{" "}
                    <span className="font-semibold text-olive-dark">
                      {ratings.all.length}
                    </span>{" "}
                    rating{ratings.all.length > 1 ? "s" : ""}.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Sticky on Desktop */}
          <div className="space-y-4 md:space-y-5 lg:sticky lg:top-24 lg:self-start">
            {/* Host Info */}
            <div className="bg-white border rounded-xl md:rounded-2xl p-4 md:p-5 shadow-md flex items-center gap-4">
              <div className="relative">
                <img
                  src={hostPic}
                  alt={hostName}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover ring-2 ring-olive"
                />
                {/* Tier Badge on Avatar */}
                <div
                  className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg border-2 border-white ${
                    hostTier === "Hiraya Host"
                      ? "bg-gradient-to-br from-emerald-600 to-emerald-400 text-white"
                      : hostTier === "Diamond"
                      ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white"
                      : hostTier === "Platinum"
                      ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800"
                      : hostTier === "Gold"
                      ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white"
                      : hostTier === "Silver"
                      ? "bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700"
                      : hostTier === "Bronze"
                      ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {hostTier === "Hiraya Host"
                    ? "✨"
                    : hostTier === "Diamond"
                    ? "💎"
                    : hostTier === "Platinum"
                    ? "⭐"
                    : hostTier === "Gold"
                    ? "👑"
                    : hostTier === "Silver"
                    ? "🥈"
                    : hostTier === "Bronze"
                    ? "🥉"
                    : "🏅"}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-olive-dark text-sm md:text-base">
                    {hostName}
                  </h4>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] md:text-xs font-bold shadow-sm ${
                      hostTier === "Hiraya Host"
                        ? "bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-500 text-white border-2 border-emerald-300 shadow-2xl shadow-emerald-500/70 animate-pulse hover:scale-105 transition-transform duration-300"
                        : hostTier === "Diamond"
                        ? "bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border border-cyan-200"
                        : hostTier === "Platinum"
                        ? "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-300"
                        : hostTier === "Gold"
                        ? "bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border border-yellow-200"
                        : hostTier === "Silver"
                        ? "bg-gradient-to-r from-gray-50 to-zinc-50 text-gray-600 border border-gray-200"
                        : hostTier === "Bronze"
                        ? "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200"
                        : "bg-gray-50 text-gray-500 border border-gray-200"
                    }`}
                  >
                    <span
                      className={`text-xs ${
                        hostTier === "Hiraya Host"
                          ? "text-white"
                          : hostTier === "Diamond"
                          ? "text-cyan-500"
                          : hostTier === "Platinum"
                          ? "text-gray-400"
                          : hostTier === "Gold"
                          ? "text-yellow-500"
                          : hostTier === "Silver"
                          ? "text-gray-400"
                          : hostTier === "Bronze"
                          ? "text-amber-600"
                          : "text-gray-400"
                      }`}
                    >
                      {hostTier === "Hiraya Host"
                        ? "✨"
                        : hostTier === "Diamond"
                        ? "💎"
                        : hostTier === "Platinum"
                        ? "⭐"
                        : hostTier === "Gold"
                        ? "👑"
                        : hostTier === "Silver"
                        ? "🥈"
                        : hostTier === "Bronze"
                        ? "🥉"
                        : "🏅"}
                    </span>
                    {hostTier || "Standard"} Host
                  </span>
                </div>
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

            {/* Reservation Box */}
            <div className="bg-white border rounded-xl md:rounded-2xl p-5 md:p-6 shadow-md space-y-4">
              {/* Price and Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-xl md:text-2xl font-bold text-olive-dark">
                  ₱{listing.price.toLocaleString()}
                  <span className="text-gray-600 text-sm font-normal">
                    {" "}
                    / night
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
                    <Heart
                      size={20}
                      className={`transition-all duration-200 ${
                        favorite
                          ? "fill-red-500 text-red-500"
                          : "text-gray-500 group-hover:text-olive-dark"
                      }`}
                    />
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="p-2.5 rounded-full border border-gray-200 hover:border-olive-dark hover:bg-olive-light/10 transition-all duration-200 group"
                    title="Share Listing"
                  >
                    <Share2
                      size={20}
                      className="text-gray-500 group-hover:text-olive-dark transition-colors"
                    />
                  </button>
                </div>
              </div>

              {/* Reserve Button - Full Width on Mobile */}
              <button
                onClick={handleReserveClick}
                className="w-full bg-gradient-to-r from-olive-dark to-olive-darker text-white font-semibold py-3 md:py-3.5 rounded-xl hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                Reserve Now
              </button>

              {/* Guests Input */}
              <div className="flex items-center justify-between border-t pt-4">
                <label className="text-gray-700 font-medium flex items-center gap-2">
                  <Users size={18} className="text-olive-dark" />
                  Guests
                </label>
                <input
                  type="number"
                  min="1"
                  max={listing.guests}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="border border-gray-200 rounded-lg px-3 py-2 w-20 text-center focus:ring-2 focus:ring-olive-dark focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Calendar Button */}
              <div className="border-t pt-4">
                <button
                  onClick={() => setShowCalendar(true)}
                  className="flex items-center justify-between w-full bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-xl transition-all duration-200 border border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-olive-dark" />
                    <span className="text-sm md:text-base font-medium text-gray-700">
                      {format(dateRange[0].startDate, "MMM dd")} -{" "}
                      {format(dateRange[0].endDate, "MMM dd, yyyy")}
                    </span>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
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
                  <Share2 size={24} className="text-olive-dark" />
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
                    className="bg-olive-dark text-white px-4 py-3 rounded-xl hover:bg-olive-darker transition-all duration-200 flex items-center gap-2 whitespace-nowrap font-medium"
                  >
                    {copiedLink ? (
                      <>
                        <Check size={18} />
                        <span className="hidden sm:inline">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 size={18} />
                        <span className="hidden sm:inline">Copy</span>
                      </>
                    )}
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
                <div className="flex items-center gap-3">
                  <div className="bg-olive-light/20 p-2 rounded-full">
                    <MessageCircle size={20} className="text-olive-dark" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-olive-dark">
                    Chat with {hostName}
                  </h3>
                </div>
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
                    <div className="bg-olive-light/10 p-4 rounded-full mb-3">
                      <MessageCircle size={32} className="text-olive-dark/40" />
                    </div>
                    <p className="text-gray-500 text-sm">
                      Start your conversation with {hostName}
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={msg.id}
                      className={`flex animate-[slideUp_0.3s_ease-out] ${
                        msg.senderId === user.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                      style={{ animationDelay: `${idx * 0.05}s` }}
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
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-olive-dark focus:border-transparent outline-none transition-all text-sm md:text-base"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="bg-olive-dark text-white px-4 md:px-5 py-3 rounded-xl hover:bg-olive-darker transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                  >
                    <Send size={18} />
                    <span className="hidden sm:inline">Send</span>
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

              <div className="flex items-center gap-3 mb-4">
                <div className="bg-olive-light/20 p-2.5 rounded-full">
                  <Calendar size={20} className="text-olive-dark" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-olive-dark">
                  Select Dates
                </h3>
              </div>

              <div className="overflow-x-auto">
                <DateRange
                  ranges={dateRange}
                  onChange={(item) => {
                    const { startDate, endDate } = item.selection;

                    const startBooked = bookedDates.some((b) => {
                      const booked = new Date(b);
                      return (
                        booked.getFullYear() === startDate.getFullYear() &&
                        booked.getMonth() === startDate.getMonth() &&
                        booked.getDate() === startDate.getDate()
                      );
                    });

                    const invalidRange = bookedDates.some((b) => {
                      const booked = new Date(b);
                      return booked >= startDate && booked <= endDate;
                    });

                    if (startBooked) {
                      alert(
                        "This date is already booked. Please choose another check-in date."
                      );
                      return;
                    }

                    if (invalidRange) {
                      alert(
                        "Selected range includes unavailable days. Please choose different dates."
                      );
                      return;
                    }

                    setDateRange([item.selection]);
                  }}
                  minDate={new Date()}
                  rangeColors={["#556B2F"]}
                  dayContentRenderer={(date) => {
                    const booked = isDateBooked(date);
                    return (
                      <div
                        style={{
                          color: booked ? "gray" : "inherit",
                          textDecoration: booked ? "line-through" : "none",
                          opacity: booked ? 0.4 : 1,
                          pointerEvents: booked ? "none" : "auto",
                          cursor: booked ? "not-allowed" : "pointer",
                        }}
                      >
                        {date.getDate()}
                      </div>
                    );
                  }}
                />
              </div>

              <div className="text-center mt-4">
                <button
                  onClick={() => setShowCalendar(false)}
                  className="w-full bg-olive-dark text-white px-6 py-3 rounded-xl hover:bg-olive-darker transition-all duration-200 font-medium"
                >
                  Confirm Dates
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reservation Summary Modal - Enhanced */}
        {showSummary && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 px-4 animate-[fadeIn_0.2s_ease-out] py-10">
            {/* 🧾 Main modal */}
            <div
              className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative animate-[slideUp_0.3s_ease-out]"
              style={{
                maxHeight: "85vh", // 🔹 slightly shorter so top never gets hidden
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* ❌ Close Button */}
              <button
                onClick={() => setShowSummary(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-all"
              >
                <X size={20} />
              </button>

              {/* Header */}
              <h3 className="text-2xl font-bold text-olive-dark mb-6 pr-8">
                Booking Summary
              </h3>

              {/* Scrollable Content */}
              <div
                className="space-y-4 mb-6 overflow-y-auto pr-1"
                style={{ maxHeight: "65vh" }} // 🔹 scroll only this part
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
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Number of Guests</span>
                    <span className="font-medium text-gray-800">
                      {guestCount}
                    </span>
                  </div>
                </div>

                {/* Dates */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Check-in</span>
                    <span className="font-medium text-gray-800">
                      {format(startDate, "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Check-out</span>
                    <span className="font-medium text-gray-800">
                      {format(endDate, "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Number of Nights</span>
                    <span className="font-medium text-gray-800">{nights}</span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Price per Night</span>
                    <span className="font-medium text-gray-800">
                      ₱{listing.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-800">
                      ₱{subtotal.toLocaleString()}
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
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 animate-[slideUp_0.3s_ease-out]">
                    <Check size={18} className="text-green-600" />
                    <span className="text-green-700 font-medium text-sm">
                      {discount}% discount applied!
                    </span>
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

              {/* Payment Button (sticky at bottom) */}
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
                        checkIn: format(startDate, "yyyy-MM-dd"),
                        checkOut: format(endDate, "yyyy-MM-dd"),
                        guests: guestCount,
                        totalAmount: total,
                        discountApplied: discount,
                        paymentId: order.id,
                        paymentStatus: order.status,
                        status: "Confirmed",
                        createdAt: new Date(),
                      });

                      const hostRef = doc(db, "users", listing.hostId);
                      const hostSnap = await getDoc(hostRef);

                      if (hostSnap.exists()) {
                        const hostData = hostSnap.data();
                        const currentEwallet = hostData.ewallet;
                        await updateDoc(hostRef, {
                          ewallet: currentEwallet + total,
                        });
                      }

                      updateHostPoints(listing.hostId, 20);

                      await axios.post(
                        "https://custom-email-backend.onrender.com/send-reservation-receipt",
                        {
                          guestEmail: user.email,
                          guestName: user.name,
                          listingTitle: listing.title,
                          hostName: hostName,
                          checkIn: format(startDate, "MMM dd, yyyy"),
                          checkOut: format(endDate, "MMM dd, yyyy"),
                          totalAmount: total,
                          guests: guestCount,
                          reservationId: order.id,
                          nights: nights,
                        },
                        { headers: { "Content-Type": "application/json" } }
                      );

                      addNotification(
                        "Reservation",
                        id,
                        listing.title,
                        auth.currentUser.uid,
                        listing.hostId,
                        20
                      );

                      if (matchedCode) {
                        await markCodeAsUsed(matchedCode)
                      }

                      alert("Reservation confirmed and payment successful!");
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

export default ListingDetails;
