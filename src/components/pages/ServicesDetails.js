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
import { ChevronLeft, ChevronRight, X, Calendar, Tag } from "lucide-react";
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
        { startDate: new Date(), endDate: new Date(Date.now() + 86400000), key: "selection" },
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
        while (bookedDates.some(d => start.toDateString() === new Date(d).toDateString())) {
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
    const isDateBooked = useCallback(
        (date) => bookedDates.some(b => new Date(b).toDateString() === date.toDateString()),
        [bookedDates]
    );

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
                const bookingsRef = collection(db, "reservations");
                const q = query(bookingsRef, where("listingId", "==", id), where("status", "==", "Confirmed"));
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

            {/* Image Viewer */}
            {selectedIndex !== null && (
                <div
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
                    onClick={() => setSelectedIndex(null)}
                >
                    <button
                        onClick={() => setSelectedIndex(null)}
                        className="absolute top-6 right-8 text-white text-3xl hover:opacity-80 transition"
                    >
                        <X size={32} />
                    </button>
                    <button
                        onClick={handlePrev}
                        className="absolute left-5 text-white hover:opacity-80"
                    >
                        <ChevronLeft size={50} />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-5 text-white hover:opacity-80"
                    >
                        <ChevronRight size={50} />
                    </button>
                    <img
                        src={images[selectedIndex]}
                        alt="Full view"
                        className="max-h-[90vh] object-contain rounded-lg"
                    />
                </div>
            )}

            {/* Main Content */}
            <div className="px-10 lg:px-20 pt-28 pb-20 space-y-10">
                <h1 className="text-3xl font-semibold text-olive-dark mb-1">
                    {listing.title}
                </h1>
                <p className="text-gray-600">{listing.location}</p>

                {/* Image grid */}
                {/* 1 IMAGE */}
                {images.length === 1 && (
                    <div
                        className="overflow-hidden rounded-2xl cursor-pointer"
                        onClick={() => setSelectedIndex(0)}
                    >
                        <img
                            src={images[0]}
                            alt=""
                            className="w-full h-[500px] object-cover hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                )}
                {/* 2 IMAGES */}
                {images.length === 2 && (
                    <div className="grid grid-cols-2 gap-3">
                        {images.map((img, i) => (
                            <div
                                key={i}
                                className="overflow-hidden rounded-2xl cursor-pointer"
                                onClick={() => setSelectedIndex(i)}
                            >
                                <img
                                    src={img}
                                    alt=""
                                    className="w-full h-[400px] object-cover hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* 3 IMAGES */}
                {images.length === 3 && (
                    <div className="grid grid-cols-3 gap-3">
                        <div
                            className="col-span-2 overflow-hidden rounded-2xl cursor-pointer"
                            onClick={() => setSelectedIndex(0)}
                        >
                            <img
                                src={images[0]}
                                alt=""
                                className="w-full h-[400px] object-cover hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                        <div className="grid grid-rows-2 gap-3">
                            {images.slice(1).map((img, i) => (
                                <div
                                    key={i + 1}
                                    className="overflow-hidden rounded-2xl cursor-pointer"
                                    onClick={() => setSelectedIndex(i + 1)}
                                >
                                    <img
                                        src={img}
                                        alt=""
                                        className="w-full h-[195px] object-cover hover:scale-105 transition-transform duration-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {images.length >= 4 && (
                    <div className="grid grid-cols-3 gap-3">
                        <div
                            className="overflow-hidden rounded-2xl cursor-pointer"
                            onClick={() => setSelectedIndex(0)}
                        >
                            <img
                                src={images[0]}
                                alt=""
                                className="w-full h-[360px] object-cover hover:scale-105 transition"
                            />
                        </div>
                        <div className="grid grid-rows-2 gap-3">
                            {images.slice(1, 3).map((img, i) => (
                                <img
                                    key={i}
                                    src={img}
                                    alt=""
                                    onClick={() => setSelectedIndex(i + 1)}
                                    className="w-full h-[175px] object-cover rounded-2xl cursor-pointer hover:scale-105 transition"
                                />
                            ))}
                        </div>
                        <div
                            className="overflow-hidden rounded-2xl cursor-pointer"
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

                {/* Two-column layout */}
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 mt-10">
                    <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-sm">
                        <h3 className="text-2xl font-semibold text-olive-dark mb-3">
                            About this service
                        </h3>
                        <p className="text-gray-800 leading-relaxed">{listingDetails}</p>
                        <div className="mt-6 border-t pt-5 text-gray-600">
                            {listing.description}
                        </div>

                        {/* 📍 Map Section */}
                        {listing.latitude && listing.longitude && (
                            <div className="mt-10">
                                <h3 className="text-2xl font-semibold text-olive-dark mb-3">
                                    Location
                                </h3>
                                <div className="rounded-2xl overflow-hidden border shadow-md">
                                    <MapContainer
                                        center={[listing.latitude, listing.longitude]}
                                        zoom={14}
                                        scrollWheelZoom={false}
                                        style={{ height: "400px", width: "100%", zIndex: 0 }}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution="&copy; <a href='https://www.openstreetmap.org/'>OpenStreetMap</a> contributors"
                                        />
                                        <Marker position={[listing.latitude, listing.longitude]} icon={customMarker}>
                                            <Popup>
                                                <div className="text-center">
                                                    <h4 className="font-semibold text-olive-dark mb-2">
                                                        {listing.title}
                                                    </h4>
                                                    <button
                                                        onClick={() =>
                                                            window.open(
                                                                `https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`,
                                                                "_blank"
                                                            )
                                                        }
                                                        className="bg-olive-dark text-white px-4 py-1.5 rounded-lg hover:opacity-90 transition"
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

                    {/* Reservation box */}
                    <div className="space-y-5">
                        {/* 🧑‍💼 Host Info */}
                        <div className="bg-white border rounded-2xl p-5 shadow-md flex items-center gap-4">
                            <img
                                src={hostPic}
                                alt={hostName}
                                className="w-14 h-14 rounded-full object-cover"
                            />
                            <div>
                                <h4 className="font-semibold text-olive-dark">{hostName}</h4>
                                <p className="text-gray-500 text-sm">Host</p>
                            </div>
                        </div>

                        {/* Message Host Button */}
                        {user && user.id !== listing.hostId && (
                            <button
                                onClick={() => setShowChat(true)}
                                className="mt-3 w-full bg-olive-dark text-white py-2 rounded-lg hover:opacity-90 transition"
                            >
                                Message Host
                            </button>
                        )}


                        {/* 💳 Reservation Box */}
                        <div className="bg-white border rounded-2xl p-6 shadow-md space-y-5">
                            {/* Price and Buttons Row */}
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold">
                                    ₱{listing.price}
                                    <span className="text-gray-600 text-sm font-normal"> {listing.priceType}</span>
                                </h2>

                                <div className="flex items-center gap-3">
                                    {/* Favorite Button */}
                                    <button onClick={handleFavoriteToggle} className="p-2 rounded-full border transition">
                                        {favorite ? <AiFillHeart className="text-olive text-xl" /> : <AiOutlineHeart className="text-gray-500 text-xl" />}
                                    </button>

                                    {/* Share Button */}
                                    <button
                                        onClick={() => setShowShareModal(true)}
                                        className="p-2 rounded-full border transition hover:bg-gray-100"
                                        title="Share Listing"
                                    >
                                        <FiShare2 className="text-gray-600 text-xl" />
                                    </button>

                                    {/* Reserve Button */}
                                    <button
                                        onClick={handleReserveClick}
                                        className="bg-olive-dark text-white font-semibold py-2 px-5 rounded-lg hover:opacity-90 transition"
                                    >
                                        Reserve
                                    </button>
                                </div>
                            </div>

                            {/* Guests Input */}
                            <div className="flex items-center justify-between border-t pt-3">
                                <label className="text-gray-700 font-medium">Guests:</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={listing.guests}
                                    value={guestCount}
                                    onChange={(e) => setGuestCount(Number(e.target.value))}
                                    className="border rounded-lg px-3 py-1.5 w-24 text-center focus:ring-2 focus:ring-olive-dark outline-none"
                                />
                            </div>

                            {/* Calendar Button */}
                            <div className="border-t pt-3 text-center">
                                <button
                                    onClick={() => setShowCalendar(true)}
                                    className="flex items-center justify-center gap-2 mx-auto bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                                >
                                    <Calendar size={18} />
                                    <span>
                                        {format(dateRange[0].startDate, "MMM dd")} -{" "}
                                        {format(dateRange[0].endDate, "MMM dd, yyyy")}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                    {showShareModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-2xl shadow-xl w-[90%] max-w-sm relative">
                                <button
                                    onClick={() => setShowShareModal(false)}
                                    className="absolute top-3 right-3 text-gray-500 hover:text-black"
                                >
                                    <X size={22} />
                                </button>
                                <h3 className="text-xl font-bold text-olive-dark mb-4 text-center">
                                    Share this listing
                                </h3>

                                <div className="space-y-4">
                                    {/* Copy link */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={currentURL}
                                            readOnly
                                            className="flex-1 border px-3 py-2 rounded-lg"
                                        />
                                        <button
                                            onClick={handleCopyLink}
                                            className="bg-olive-dark text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
                                        >
                                            Copy
                                        </button>
                                    </div>

                                    {/* Social links */}
                                    <div className="flex justify-center gap-4">
                                        <a
                                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentURL)}&quote=${encodeURIComponent(listing.title)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
                                        >
                                            Facebook
                                        </a>
                                        <a
                                            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentURL)}&text=${encodeURIComponent(listing.title)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-blue-400 text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
                                        >
                                            Twitter
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {showChat && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white w-[90%] max-w-md rounded-2xl p-6 relative shadow-xl">
                                <button
                                    onClick={() => setShowChat(false)}
                                    className="absolute top-3 right-3 text-gray-500 hover:text-black"
                                >
                                    <X size={22} />
                                </button>

                                <h3 className="text-xl font-semibold text-olive-dark mb-4 text-center">
                                    Chat with {hostName}
                                </h3>

                                {/* Chat messages container */}
                                <div className="border rounded-lg p-3 h-64 overflow-y-auto mb-3 bg-gray-50">
                                    {messages.length === 0 ? (
                                        <p className="text-gray-500 text-sm text-center">
                                            Start your conversation with {hostName}...
                                        </p>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`mb-2 flex ${msg.senderId === user.id ? "justify-end" : "justify-start"
                                                    }`}
                                            >
                                                <div
                                                    className={`px-3 py-2 rounded-lg max-w-[70%] ${msg.senderId === user.id
                                                        ? "bg-olive-dark text-white"
                                                        : "bg-gray-200 text-gray-800"
                                                        }`}
                                                >
                                                    <p>{msg.text}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>


                                {/* Input box */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-olive-dark outline-none"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        className="bg-olive-dark text-white px-4 py-2 rounded-lg hover:opacity-90"
                                    >
                                        Send
                                    </button>

                                </div>
                            </div>
                        </div>
                    )}


                </div>

                {/* Calendar modal */}
                {showCalendar && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-4 rounded-2xl shadow-xl relative w-[90%] max-w-md">
                            <button
                                onClick={() => setShowCalendar(false)}
                                className="absolute top-3 right-3 text-gray-500 hover:text-black"
                            >
                                <X size={22} />
                            </button>
                            <h3 className="text-lg font-semibold text-olive-dark mb-3 text-center">
                                Select Dates
                            </h3>
                            <DateRange
                                ranges={dateRange}
                                onChange={(item) => {
                                    const selectedDate = item.selection.startDate;

                                    // Prevent selecting already booked date
                                    const isBooked = bookedDates.some((b) =>
                                        new Date(b).toDateString() === selectedDate.toDateString()
                                    );

                                    if (isBooked) {
                                        alert("This date is already booked. Please choose another date.");
                                        return;
                                    }

                                    // Force single-day range
                                    setDateRange([
                                        { startDate: selectedDate, endDate: selectedDate, key: "selection" },
                                    ]);
                                }}
                                showDateDisplay={false}
                                minDate={new Date()}
                                rangeColors={["#556B2F"]}
                            />



                            <div className="text-center mt-4">
                                <button
                                    onClick={() => setShowCalendar(false)}
                                    className="bg-olive-dark text-white px-5 py-2 rounded-lg hover:opacity-90 transition"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reservation Summary Modal */}
                {showSummary && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl p-6 w-[90%] max-w-lg shadow-lg relative">
                            <button
                                onClick={() => setShowSummary(false)}
                                className="absolute top-3 right-3 text-gray-500 hover:text-black"
                            >
                                <X size={22} />
                            </button>
                            <h3 className="text-xl font-bold text-olive-dark text-center mb-4">
                                Booking Summary
                            </h3>

                            <div className="space-y-3 text-gray-700">
                                <p><strong>Guest Name:</strong> {user.name}</p>
                                <p><strong>Guest Email:</strong> {user.email}</p>
                                <p><strong>Guests:</strong> {guestCount}</p>
                                <p><strong>Booked Date:</strong> {format(startDate, "MMM dd, yyyy")}</p>
                                <p><strong>Price {listing.priceType}:</strong> ₱{listing.price}</p>

                                <div className="flex items-center gap-2 mt-4">
                                    <Tag size={18} />
                                    <input
                                        type="text"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                        placeholder="Enter promo code"
                                        className="border px-3 py-2 rounded-lg w-full"
                                    />
                                    <button
                                        onClick={handleApplyPromo}
                                        className="bg-olive-dark text-white px-3 py-2 rounded-lg hover:opacity-90"
                                    >
                                        Apply
                                    </button>
                                </div>

                                {discount > 0 && (
                                    <p className="text-green-600 mt-2">
                                        Discount Applied: {discount}% off
                                    </p>
                                )}

                                <div className="border-t pt-3 text-lg font-semibold text-right">
                                    Total: ₱{total.toLocaleString()}
                                </div>
                            </div>

                            <div className="text-center mt-6">
                                <PayPalButtons
                                    style={{ layout: "vertical", color: "gold" }}
                                    createOrder={(data, actions) => {
                                        return actions.order.create({
                                            purchase_units: [
                                                {
                                                    amount: {
                                                        currency_code: "PHP",
                                                        value: total.toFixed(2), // your total price
                                                    },
                                                    description: listing.title,
                                                },
                                            ],
                                        });
                                    }}
                                    onApprove={async (data, actions) => {
                                        const order = await actions.order.capture();

                                        // ✅ Save to Firestore after successful payment
                                        try {
                                            await addDoc(collection(db, "reservations"), {
                                                listingId: id,
                                                guestId: auth.currentUser.uid,
                                                hostId: listing.hostId,
                                                bookedDate: format(startDate, "yyyy-MM-dd"), // ✅ single day
                                                guests: guestCount,
                                                totalAmount: discount
                                                    ? listing.price - listing.price * (discount / 100)
                                                    : listing.price,
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
                                                const currentEwallet = hostData.ewallet; // default to 0 if undefined

                                                await updateDoc(hostRef, {
                                                    ewallet: currentEwallet + total,
                                                });
                                            }

                                            console.log("email sent to: " + user.email);
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
                                                {
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                    },
                                                }
                                            );

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
        </div>
    );
};

export default ServicesDetails;
