import React, { useState, useEffect } from "react";
import { Calendar, MapPin, Star } from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
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
  const [user, setUser] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showModal, setShowModal] = useState(false);
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
      // Fetch reservations
      const q = query(
        collection(db, "reservations"),
        where("guestId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const fetched = [];
      const today = new Date();

      for (const resDoc of querySnapshot.docs) {
        const resData = resDoc.data();
        const listingRef = doc(db, "listings", resData.listingId);
        const listingSnap = await getDoc(listingRef);

        if (listingSnap.exists()) {
          const fullRes = {
            id: resDoc.id,
            ...resData,
            listing: { id: listingSnap.id, ...listingSnap.data() },
            rated: false, // default false
          };

          // Auto-complete past reservations
          if (fullRes.checkOut) {
            const checkOutDate = new Date(fullRes.checkOut);
            if (checkOutDate < today && fullRes.status !== "Completed") {
              const resRef = doc(db, "reservations", resDoc.id);
              await updateDoc(resRef, { status: "Completed" });
              fullRes.status = "Completed";
            }
          }

          fetched.push(fullRes);
        }
      }

      // Fetch all ratings by this user
      const ratingsQuery = query(
        collection(db, "ratings"),
        where("guestId", "==", user.uid)
      );
      const ratingsSnapshot = await getDocs(ratingsQuery);
      const ratedReservations = ratingsSnapshot.docs.map(
        (doc) => doc.data().reservationId
      );

      // Mark reservations that are rated
      const updatedReservations = fetched.map((res) => ({
        ...res,
        rated: ratedReservations.includes(res.id),
      }));

      // Sort newest first
      updatedReservations.sort((a, b) => {
        const dateA =
          a.createdAt?.seconds || new Date(a.createdAt).getTime() || 0;
        const dateB =
          b.createdAt?.seconds || new Date(b.createdAt).getTime() || 0;
        return dateB - dateA;
      });

      setReservations(updatedReservations);
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

      await axios.post(
        "https://custom-email-backend.onrender.com/send-cancellation-email",
        {
          guestEmail: user.email,
          guestName: user.displayName || "Guest",
          listingTitle: res.listing?.title,
          hostName: res.listing?.hostName || "Host",
          checkIn: res.checkIn,
          checkOut: res.checkOut,
          totalAmount: res.totalAmount,
          reservationId: res.id,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      alert("Reservation canceled successfully.");
    } catch (error) {
      console.error("Error canceling reservation:", error);
      alert("Failed to cancel reservation.");
    }
  };

  // Open modal for rating
  const openRatingModal = (reservation) => {
    setSelectedReservation(reservation);
    setRating(0);
    setHoverRating(0);
    setComment("");
    setShowModal(true);
  };

  // Submit rating
  const handleSubmitRating = async () => {
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }

    try {
      await addDoc(collection(db, "ratings"), {
        reservationId: selectedReservation.id,
        listingId: selectedReservation.listing.id,
        guestId: user.uid,
        guestName: user.displayName || "Guest",
        rating,
        comment,
        rated: true,
        createdAt: new Date(),
      });

      alert("Thank you for your feedback!");
      setShowModal(false);

      setReservations((prev) =>
        prev.map((r) =>
          r.id === selectedReservation.id
            ? { ...r, rated: true }
            : r
        )
      );
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating.");
    }
  };

  const handleViewListing = async (listingId) => {
    try{
      const listingRef = doc(db, "listings", listingId);
      const listingSnap = await getDoc(listingRef);
      const listingData = listingSnap.data();

      if (!listingSnap.exists()) {
        if(listingData.supercategory === "homes")
        {
          navigate(`/homes/${listingId}`);
        } else if(listingData.supercategory === "experiences")
        {
          navigate(`/experiences/${listingId}`);
        } else if(listingData.supercategory === "services") {
          navigate(`/services/${listingId}`);
        } else {
          alert("Listing category is unknown.");
        }


    
    }
  } 
    catch (error) {
      console.error("Error viewing listing:", error);
      alert("Failed to view listing.");
    }
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

                    {res.status === "Completed" ? (
                      <button
                        onClick={() => openRatingModal(res)}
                        disabled={res.rated}
                        className={`${
                          res.rated
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-yellow-500 text-white hover:bg-yellow-600"
                        } px-4 py-2 rounded-lg font-semibold`}
                      >
                        {res.rated ? "Rated" : "Rate"}
                      </button>
                    ) : res.status !== "Canceled" && res.status !== "Completed" ? (
                      <button
                        onClick={() => handleCancel(res)}
                        className="text-red-600 font-semibold hover:underline"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rating Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl p-6 w-[90%] sm:w-[400px] shadow-xl">
              <h2 className="text-xl font-bold text-center mb-4">
                Rate Your Stay
              </h2>

              <div className="flex justify-center mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-8 h-8 cursor-pointer ${
                      (hoverRating || rating) >= star
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Leave a comment (optional)"
                className="w-full border border-gray-300 rounded-lg p-2 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                rows={4}
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRating}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GuestReservations;
