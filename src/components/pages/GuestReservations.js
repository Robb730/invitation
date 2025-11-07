import React, { useState, useEffect } from "react";
import { Calendar, MapPin, Star, ArrowRight, X, CheckCircle } from "lucide-react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const statusColor = {
    Confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Cancelled: "bg-rose-100 text-rose-700 border-rose-200",
    Completed: "bg-blue-100 text-blue-700 border-blue-200",
    "Cancellation Requested": "bg-orange-100 text-orange-700 border-orange-200",
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
            const listingData = listingSnap.data();
            let hostName = "Unknown Host";

            if (listingData.hostId) {
              const hostRef = doc(db, "users", listingData.hostId);
              const hostSnap = await getDoc(hostRef);
              if (hostSnap.exists()) {
                const hostData = hostSnap.data();
                hostName = hostData.fullName || hostData.name || "Unknown Host";
              }
            }

            const fullRes = {
              id: resDoc.id,
              ...resData,
              listing: {
                id: listingSnap.id,
                ...listingData,
                hostName,
              },
              rated: false,
            };

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

        const ratingsQuery = query(
          collection(db, "ratings"),
          where("guestId", "==", user.uid)
        );
        const ratingsSnapshot = await getDocs(ratingsQuery);
        const ratedReservations = ratingsSnapshot.docs.map(
          (doc) => doc.data().reservationId
        );

        const updatedReservations = fetched.map((res) => ({
          ...res,
          rated: ratedReservations.includes(res.id),
        }));

        updatedReservations.sort((a, b) => {
          const dateA = a.createdAt?.seconds || new Date(a.createdAt).getTime() || 0;
          const dateB = b.createdAt?.seconds || new Date(b.createdAt).getTime() || 0;
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

  const handleCancel = async (res) => {
    if (!window.confirm("Do you want to request a cancellation for this reservation?")) return;

    try {
      const reservationRef = doc(db, "reservations", res.id);
      await updateDoc(reservationRef, { status: "Cancellation Requested" });

      setReservations((prev) =>
        prev.map((r) =>
          r.id === res.id ? { ...r, status: "Cancellation Requested" } : r
        )
      );

      alert("Your cancellation request has been sent to the host.");
    } catch (error) {
      console.error("Error sending cancellation request:", error);
      alert("Failed to send cancellation request.");
    }
  };

  const openRatingModal = (reservation) => {
    setSelectedReservation(reservation);
    setRating(0);
    setHoverRating(0);
    setComment("");
    setShowModal(true);
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }

    setIsSubmitting(true);

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

      setReservations((prev) =>
        prev.map((r) =>
          r.id === selectedReservation.id ? { ...r, rated: true } : r
        )
      );

      setTimeout(() => {
        setShowModal(false);
        setIsSubmitting(false);
      }, 800);
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating.");
      setIsSubmitting(false);
    }
  };

  const handleViewListing = async (listingId) => {
    try {
      const listingRef = doc(db, "listings", listingId);
      const listingSnap = await getDoc(listingRef);

      if (!listingSnap.exists()) {
        alert("Listing not found.");
        return;
      }

      const listingData = listingSnap.data();

      if (listingData.superCategory === "Homes") {
        navigate(`/homes/${listingId}`);
      } else if (listingData.superCategory === "Experiences") {
        navigate(`/experiences/${listingId}`);
      } else if (listingData.superCategory === "Services") {
        navigate(`/services/${listingId}`);
      } else {
        alert("Listing category is unknown.");
      }
    } catch (error) {
      console.error("Error viewing listing:", error);
      alert("Failed to view listing.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-5 sm:px-10 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              Your Reservations
            </h1>
            <p className="text-gray-600 text-lg">
              Manage and track all your bookings in one place
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-olive rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600 text-lg animate-pulse">Loading your reservations...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-20 animate-fade-in">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">No reservations yet</h2>
              <p className="text-gray-600 text-lg mb-6">Start exploring and book your next adventure!</p>
              <button
                onClick={() => navigate("/homes")}
                className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Browse Listings
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reservations.map((res, idx) => (
                <div
                  key={res.id}
                  className="group bg-white rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 animate-slide-up"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div
                    className="relative w-full h-56 overflow-hidden"
                    onMouseEnter={() => setHoveredId(res.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {res.listing?.images?.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`${res.listing?.title || "Listing"} ${index + 1}`}
                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out transform
                          ${
                            hoveredId === res.id
                              ? index === currentIndex
                                ? "opacity-100 scale-110"
                                : "opacity-0 scale-100"
                              : index === 0
                              ? "opacity-100 scale-100"
                              : "opacity-0 scale-100"
                          }`}
                      />
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <span
                      className={`absolute top-4 right-4 text-xs font-bold px-4 py-2 rounded-full border backdrop-blur-sm transition-all duration-300 ${
                        statusColor[res.status]
                      }`}
                    >
                      {res.status}
                    </span>
                  </div>

                  <div className="p-6 flex flex-col gap-y-3">
                    <h2 className="text-xl font-bold text-gray-900 line-clamp-1 group-hover:text-olive transition-colors duration-300">
                      {res.listing?.title || "Unknown Listing"}
                    </h2>
                    
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center text-gray-600 gap-x-2">
                        <MapPin className="h-4 w-4 text-olive flex-shrink-0" />
                        <span className="line-clamp-1">{res.listing?.location || "Unknown location"}</span>
                      </p>
                      
                      <p className="flex items-start text-gray-600 gap-x-2">
                        <Calendar className="h-4 w-4 text-olive flex-shrink-0 mt-0.5" />
                        {res.listing.superCategory === "Homes" ? (
                          <span className="text-xs leading-relaxed">
                            <span className="font-semibold text-gray-800">Check-in:</span> {res.checkIn}
                            <br />
                            <span className="font-semibold text-gray-800">Check-out:</span> {res.checkOut}
                          </span>
                        ) : (
                          <span className="text-xs">
                            <span className="font-semibold text-gray-800">Date:</span> {res.checkIn || res.bookedDate || "N/A"}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleViewListing(res.listing.id)}
                        className="w-full bg-olive text-white px-4 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                      >
                        View Listing
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      {res.status === "Completed" ? (
                        <button
                          onClick={() => openRatingModal(res)}
                          disabled={res.rated}
                          className={`w-full px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                            res.rated
                              ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                              : "bg-gradient-to-r from-amber-400 to-yellow-500 text-white hover:from-amber-500 hover:to-yellow-600 shadow-md hover:shadow-lg transform hover:scale-105"
                          }`}
                        >
                          {res.rated ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Already Rated
                            </>
                          ) : (
                            <>
                              <Star className="w-4 h-4" />
                              Rate Experience
                            </>
                          )}
                        </button>
                      ) : res.status !== "Cancelled" &&
                        res.status !== "Completed" &&
                        res.status !== "Cancellation Requested" ? (
                        <button
                          onClick={() => handleCancel(res)}
                          className="w-full text-rose-600 font-semibold hover:text-rose-700 hover:bg-rose-50 py-3 rounded-xl transition-all duration-300"
                        >
                          Request Cancellation
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Rating Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl transform animate-scale-up">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Rate Your Experience
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
                <p className="text-sm font-semibold text-gray-700 mb-1">Listing</p>
                <p className="text-gray-900 font-medium">{selectedReservation?.listing?.title}</p>
              </div>

              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-12 h-12 cursor-pointer transition-all duration-200 transform hover:scale-110 ${
                      (hoverRating || rating) >= star
                        ? "text-amber-400 fill-amber-400"
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
                placeholder="Share your experience (optional)"
                className="w-full border-2 border-gray-200 rounded-2xl p-4 mb-6 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                rows={4}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRating}
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-amber-500 hover:to-yellow-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    "Submit Rating"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-up {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
          animation-fill-mode: both;
        }

        .animate-scale-up {
          animation: scale-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default GuestReservations;