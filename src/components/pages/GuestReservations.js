import React, { useState, useEffect } from "react";
import { Calendar, MapPin } from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import Navbar from "./homepage-comp/Navbar";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";


const GuestReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [user, setUser] = useState(null); // ✅ track logged-in user
  const navigate = useNavigate();

  const statusColor = {
    Confirmed: "bg-green-100 text-green-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Canceled: "bg-red-100 text-red-700",
    Completed: "bg-blue-100 text-blue-700",
  };

  // Auto image slideshow when hovered
  useEffect(() => {
    if (!hoveredId) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const hoveredListing = reservations.find((r) => r.id === hoveredId);
        const totalImages = hoveredListing?.listing?.images?.length || 1;
        return (prev + 1) % totalImages;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [hoveredId, reservations]);

  // Fetch guest reservations
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      setUser(null);
      setReservations([]);
      setLoading(false);
      alert("Please log in to view your reservations.");
      navigate("/login");
      return;
    }

    setUser(user);
    setLoading(true);

    try {
      // ❌ remove orderBy("createdAt", "desc") since it needs an index
      const q = query(
        collection(db, "reservations"),
        where("guestId", "==", user.uid)
      );

      const querySnapshot = await getDocs(q);
      const fetched = [];

      for (const resDoc of querySnapshot.docs) {
        const resData = resDoc.data();
        const listingRef = doc(db, "listings", resData.listingId);
        const listingSnap = await getDoc(listingRef);

        if (listingSnap.exists()) {
          fetched.push({
            id: resDoc.id,
            ...resData,
            listing: { id: listingSnap.id, ...listingSnap.data() },
          });
        }
      }

      // 🟢 manually sort newest first (based on createdAt)
      fetched.sort((a, b) => {
        const dateA =
          a.createdAt?.seconds || new Date(a.createdAt).getTime() || 0;
        const dateB =
          b.createdAt?.seconds || new Date(b.createdAt).getTime() || 0;
        return dateB - dateA; // newest first
      });

      setReservations(fetched);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }

    setLoading(false);
  });

  return () => unsubscribe();
}, [navigate]);

  // Cancel reservation
  const handleCancel = async (res) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?"))
      return;

    try {
      const reservationRef = doc(db, "reservations", res.id);
      await updateDoc(reservationRef, { status: "Cancelled" });
      setReservations((prev) =>
        prev.map((r) => (r.id === res.id ? { ...r, status: "Canceled" } : r))
      );

      // ✅ Send cancellation email
      await axios.post("https://custom-email-backend.onrender.com/send-cancellation-email", {
          guestEmail: user.email,
          guestName: user.displayName || "Guest",
          listingTitle: res.listing?.title,
          hostName: res.listing?.hostName || "Host",
          checkIn: res.checkIn,
          checkOut: res.checkOut,
          totalAmount: res.totalAmount,
          reservationId: res.id,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

      alert("Reservation canceled successfully.");
    } catch (error) {
      console.error("Error canceling reservation:", error);
      alert("Failed to cancel reservation.");
    }
  };

  // Navigate to listing details
  const handleViewListing = (listingId) => {
    navigate(`/room/${listingId}`);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-beige px-5 sm:px-10 py-24">
        <h1 className="text-3xl font-bold text-charcoal mb-6">
          Your Reservations
        </h1>

        {loading ? (
          <p className="text-gray-600 text-lg">Loading your reservations...</p>
        ) : reservations.length === 0 ? (
          <p className="text-gray-600 text-lg">You have no reservations yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reservations.map((res) => (
              <div
                key={res.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div
                  className="relative w-full h-48 overflow-hidden"
                  onMouseEnter={() => setHoveredId(res.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {res.listing?.images?.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${res.listing?.title || "Listing"} ${index + 1}`}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out
                        ${
                          hoveredId === res.id
                            ? index === currentIndex
                              ? "opacity-100"
                              : "opacity-0"
                            : index === 0
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                    />
                  ))}
                </div>

                <div className="p-5 flex flex-col gap-y-2">
                  <h2 className="text-xl font-semibold text-charcoal">
                    {res.listing?.title || "Unknown Listing"}
                  </h2>
                  <p className="flex items-center text-gray-600 gap-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    {res.listing?.location || "Unknown location"}
                  </p>
                  <p className="flex items-center text-gray-600 gap-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>
                      <span className="font-bold">Check-in:</span> {res.checkIn}{" "}
                      <span className="font-bold">Check-out:</span> {res.checkOut}
                    </span>
                  </p>

                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-full mt-2 self-start ${statusColor[res.status]}`}
                  >
                    {res.status}
                  </span>

                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={() => handleViewListing(res.listing.id)}
                      className="bg-olive-dark text-beige px-4 py-2 rounded-lg font-semibold hover:bg-olive transition"
                    >
                      View Listing
                    </button>
                    {res.status !== "Canceled" && res.status !== "Completed" && (
                      <button
                        onClick={() => handleCancel(res)}
                        className="text-red-600 font-semibold hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default GuestReservations;
