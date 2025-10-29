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
  

  
  const [bookedDates, setBookedDates] = useState([]);
  const [dateRange, setDateRange] = useState([
  { startDate: new Date(), endDate: new Date(Date.now() + 86400000), key: "selection" },
]);

// 2️⃣ Function to get earliest available date
const getEarliestAvailableDate = useCallback(() => {
  const today = new Date();
  let start = new Date(today);

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
        const q = query(bookingsRef, where("listingId", "==", id));
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
    const user = auth.currentUser;
    if (!user) return;
    const fetchUser = async () => {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) setUser(snap.data());
    };
    fetchUser();
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
  const listingDetails = `${listing.guests} guest/s • ${listing.bedrooms} bedroom/s • ${listing.bathrooms} bath/s`;

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
    const { startDate, endDate } = dateRange[0];
    if (!auth.currentUser) {
      alert("You must be logged in to make a reservation.");
      return;
    }
    if (!startDate || !endDate) {
      alert("Please select valid dates.");
      return;
    }
    if(format(startDate, "MMM dd, yyyy") === format(endDate, "MMM dd, yyyy")){
      alert("Check-out date must be after check-in date.");
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

  // 🔹 Final reserve confirmation
  // const handleConfirmReservation = async () => {
  //   const { startDate, endDate } = dateRange[0];
  //   const user = auth.currentUser;

  //   const nights = Math.max(1, differenceInDays(endDate, startDate));
  //   const basePrice = listing.price * nights;
  //   const total = discount ? basePrice - basePrice * (discount / 100) : basePrice;

  //   try {
  //     await addDoc(collection(db, "reservations"), {
  //       listingId: id,
  //       guestId: user.uid,
  //       checkIn: format(startDate, "yyyy-MM-dd"),
  //       checkOut: format(endDate, "yyyy-MM-dd"),
  //       guests: guestCount,
  //       totalAmount: total,
  //       discountApplied: discount,
  //       createdAt: new Date(),
  //     });

  //     alert("Reservation successful!");
  //     setShowSummary(false);
  //   } catch (err) {
  //     console.error("Error creating reservation:", err);
  //     alert("Failed to create reservation.");
  //   }
  // };

  // 🔹 Price calculation
  const { startDate, endDate } = dateRange[0];
  const nights = Math.max(1, differenceInDays(endDate, startDate));
  const subtotal = listing.price * nights;
  const total = discount ? subtotal - subtotal * (discount / 100) : subtotal;

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
              About this place
            </h3>
            <p className="text-gray-800 leading-relaxed">{listingDetails}</p>
            <div className="mt-6 border-t pt-5 text-gray-600">
              {listing.description}
            </div>
          </div>

          {/* Reservation box */}
          <div className="space-y-5">
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

            <div className="bg-white border rounded-2xl p-6 shadow-md space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  ₱{listing.price}
                  <span className="text-gray-600 text-sm font-normal">
                    {" "}
                    / night
                  </span>
                </h2>
                <button
                  onClick={handleReserveClick}
                  className="bg-olive-dark text-white font-semibold py-2 px-5 rounded-lg hover:opacity-90 transition"
                >
                  Reserve
                </button>
              </div>

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
                onChange={(item) => setDateRange([item.selection])}
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
                      }}
                    >
                      {date.getDate()}
                    </div>
                  );
                }}
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
        <p><strong>Check-in:</strong> {format(startDate, "MMM dd, yyyy")}</p>
        <p><strong>Check-out:</strong> {format(endDate, "MMM dd, yyyy")}</p>
        <p><strong>Nights:</strong> {nights}</p>
        <p><strong>Price per Night:</strong> ₱{listing.price}</p>
        <p><strong>Subtotal:</strong> ₱{subtotal.toLocaleString()}</p>

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
                checkIn: format(startDate, "yyyy-MM-dd"),
                checkOut: format(endDate, "yyyy-MM-dd"),
                guests: guestCount,
                totalAmount: total,
                discountApplied: discount,
                paymentId: order.id,
                paymentStatus: order.status,
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

export default ListingDetails;
