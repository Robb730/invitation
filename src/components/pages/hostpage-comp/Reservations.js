import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  Calendar,
  Clock,
  User,
  X,
  Edit,
  Save,
  Trash,
  Filter,
} from "lucide-react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import axios from "axios";

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [hostId, setHostId] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dateRange, setDateRange] = useState([
    { startDate: new Date(), endDate: new Date(), key: "selection" },
  ]);
  const [editedGuests, setEditedGuests] = useState(1);

  // 🔹 Detect logged-in host
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setHostId(user.uid);
      else setHostId(null);
    });
    return unsubscribe;
  }, []);

  // 🔹 Fetch reservations
  useEffect(() => {
    const fetchReservations = async () => {
      if (!hostId) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, "reservations"),
          where("hostId", "==", hostId)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReservations(data);
      } catch (error) {
        console.error("Error fetching reservations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [hostId]);

  // 🔹 Fetch listing and guest details
  useEffect(() => {
    const fetchExtraDetails = async () => {
      if (reservations.length === 0) return;

      try {
        const updatedReservations = await Promise.all(
          reservations.map(async (reservation) => {
            let listingTitle = "Untitled Listing";
            let listingCategory = "Unknown Category";
            let guestName = "Unknown Guest";
            let guestPic = null;

            if (reservation.listingId) {
              const listingRef = doc(db, "listings", reservation.listingId);
              const listingSnap = await getDoc(listingRef);
              if (listingSnap.exists()) {
                listingTitle = listingSnap.data().title || "Untitled Listing";
                listingCategory =
                  listingSnap.data().superCategory || "Unknown Category";
              }
            }

            if (reservation.guestId) {
              const guestRef = doc(db, "users", reservation.guestId);
              const guestSnap = await getDoc(guestRef);
              if (guestSnap.exists()) {
                const guestData = guestSnap.data();
                guestName =
                  guestData.name || guestData.fullName || "Unknown Guest";
                guestPic = guestData.profilePic || guestData.photoURL || null;
              }
            }

            return {
              ...reservation,
              listingTitle,
              listingCategory,
              guestName,
              guestPic,
            };
          })
        );

        setReservations(updatedReservations);
      } catch (error) {
        console.error("Error fetching extra details:", error);
      }
    };

    fetchExtraDetails();
  }, [reservations.length, reservations]);

  // 🔹 Apply filter
  useEffect(() => {
    if (filter === "all") setFilteredReservations(reservations);
    else
      setFilteredReservations(reservations.filter((r) => r.status === filter));
  }, [filter, reservations]);

  // 🔹 Modal handlers
  const openModal = (reservation) => {
    setSelectedReservation(reservation);
    setEditedGuests(reservation.guests || 1);
    setDateRange([
      {
        startDate: new Date(reservation.checkIn),
        endDate: new Date(reservation.checkOut),
        key: "selection",
      },
    ]);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedReservation(null);
    setShowModal(false);
    setIsEditing(false);
  };

  // 🔹 Save updates
  const saveChanges = async () => {
    try {
      const resRef = doc(db, "reservations", selectedReservation.id);
      await updateDoc(resRef, {
        guests: editedGuests,
        checkIn: dateRange[0].startDate.toDateString(),
        checkOut: dateRange[0].endDate.toDateString(),
      });
      alert("Reservation updated successfully!");
      closeModal();
    } catch (error) {
      console.error("Error updating reservation:", error);
      alert("Failed to update reservation.");
    }
  };

  // 🔹 Cancel reservation
  const cancelReservation = async () => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this reservation?"
    );
    if (!confirmCancel) return;

    try {
      const resRef = doc(db, "reservations", selectedReservation.id);
      await updateDoc(resRef, { status: "cancelled" });
      alert("Reservation cancelled.");
      closeModal();
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      alert("Failed to cancel reservation.");
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-3xl shadow-2xl p-8 w-full max-w-6xl mx-auto mt-10 min-h-[70vh] border border-white/60">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-olive-dark tracking-tight">Reservations</h2>
          <p className="text-sm text-gray-600 mt-1">Manage and track your property bookings</p>
        </div>
        
        {/* 🔹 Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            "all",
            "Confirmed",
            "Completed",
            "Cancelled",
            "Cancellation Requested",
          ].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                filter === type
                  ? "bg-olive-dark text-white shadow-lg scale-105"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-md"
              }`}
            >
              <Filter size={14} />
              {type === "Cancellation Requested"
                ? "Cancellation Requests"
                : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center gap-3 text-gray-500">
            <div className="w-6 h-6 border-3 border-olive-dark/30 border-t-olive-dark rounded-full animate-spin"></div>
            <span className="text-lg font-medium">Loading reservations...</span>
          </div>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center bg-gray-50/50">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Filter size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium text-lg">No {filter === "all" ? "" : filter} reservations found</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or check back later</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {filteredReservations.map((reservation, index) => (
            <div
              key={reservation.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="bg-white hover:bg-gradient-to-r hover:from-white hover:to-olive-light/10 border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 animate-fadeIn"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-olive-dark mb-1">
                    {reservation.listingTitle}
                  </h3>
                  <p className="text-sm text-gray-500">Reservation #{reservation.id.slice(0, 8)}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full shadow-sm border ${
                    reservation.status === "Confirmed"
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200"
                      : reservation.status === "Cancellation Requested"
                      ? "bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-yellow-200"
                      : reservation.status === "Completed"
                      ? "bg-gradient-to-r from-blue-50 to-sky-50 text-blue-700 border-blue-200"
                      : "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    reservation.status === "Confirmed"
                      ? "bg-green-500 animate-pulse"
                      : reservation.status === "Cancellation Requested"
                      ? "bg-yellow-500 animate-pulse"
                      : reservation.status === "Completed"
                      ? "bg-blue-500"
                      : "bg-red-500"
                  }`} />
                  {reservation.status || "Pending"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-t border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-olive-dark/10 flex items-center justify-center">
                    <User size={18} className="text-olive-dark" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Guest</p>
                    <p className="text-sm font-semibold text-gray-800">{reservation.guestName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <Calendar size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">
                      {reservation.listingCategory === "Homes" ? "Check-in / Check-out" : "Schedule"}
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {reservation.listingCategory === "Homes"
                        ? `${reservation.checkIn} → ${reservation.checkOut}`
                        : reservation.checkIn}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                    <Clock size={18} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Booked on</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {reservation.createdAt?.toDate
                        ? reservation.createdAt.toDate().toLocaleDateString()
                        : new Date(reservation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-4 gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-gray-500 font-medium">Total Amount:</span>
                  <span className="text-2xl font-bold text-olive-dark">
                    ₱{reservation.totalAmount?.toLocaleString() || 0}
                  </span>
                </div>
                <button
                  onClick={() => openModal(reservation)}
                  className="bg-olive-dark text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-olive-dark/90 transition-all duration-200 hover:shadow-lg hover:scale-105 flex items-center gap-2 justify-center"
                >
                  <span>View Details</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🔹 Modal with animations */}
      {showModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden max-h-[90vh] overflow-y-auto animate-slideUp">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-olive-dark to-olive-dark/90 p-6 relative">
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all duration-200 hover:rotate-90"
              >
                <X size={20} />
              </button>
              <h3 className="text-2xl font-bold text-white pr-10">
                {selectedReservation.listingTitle}
              </h3>
              <p className="text-white/80 text-sm mt-1">Reservation Details</p>
            </div>

            {/* Guest info section */}
            <div className="p-6">
              <div className="flex flex-col items-center mb-6 pb-6 border-b border-gray-200">
                {selectedReservation.guestPic ? (
                  <img
                    src={selectedReservation.guestPic}
                    alt="Guest"
                    className="w-24 h-24 rounded-full object-cover mb-3 border-4 border-white shadow-lg ring-2 ring-olive-dark/20"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-olive-dark/20 to-olive-dark/10 flex items-center justify-center mb-3 border-4 border-white shadow-lg">
                    <User size={36} className="text-olive-dark" />
                  </div>
                )}
                <p className="font-bold text-lg text-gray-800">
                  {selectedReservation.guestName}
                </p>
                <span
                  className={`mt-3 inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full shadow-sm ${
                    selectedReservation.status === "Confirmed"
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200"
                      : selectedReservation.status === "Cancellation Requested"
                      ? "bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border border-yellow-200"
                      : selectedReservation.status === "Completed"
                      ? "bg-gradient-to-r from-blue-50 to-blue-50 text-blue-700 border border-blue-200"
                      : "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    selectedReservation.status === "Confirmed"
                      ? "bg-green-500 animate-pulse"
                      : selectedReservation.status === "Cancellation Requested"
                      ? "bg-yellow-500 animate-pulse"
                      : selectedReservation.status === "Completed"
                      ? "bg-blue-500 animate-pulse"
                      : "bg-red-500"
                  }`} />
                  {selectedReservation.status || "Pending"}
                </span>
              </div>

              {!isEditing ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-semibold text-gray-600">Created:</span>
                      <span className="text-sm text-gray-800 text-right">
                        {selectedReservation.createdAt?.toDate
                          ? selectedReservation.createdAt.toDate().toLocaleString()
                          : new Date(selectedReservation.createdAt).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-start border-t border-gray-200 pt-3">
                      <span className="text-sm font-semibold text-gray-600">Discount:</span>
                      <span className="text-sm text-gray-800">
                        {selectedReservation.discountApplied
                          ? `${selectedReservation.discountApplied}%`
                          : "No discount"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-start border-t border-gray-200 pt-3">
                      <span className="text-sm font-semibold text-gray-600">Guests:</span>
                      <span className="text-sm text-gray-800">{selectedReservation.guests || 1}</span>
                    </div>

                    <div className="flex justify-between items-start border-t border-gray-200 pt-3">
                      <span className="text-sm font-semibold text-gray-600">
                        {selectedReservation.listingCategory === "Homes" ? "Check-in / Check-out:" : "Schedule:"}
                      </span>
                      <span className="text-sm text-gray-800 text-right">
                        {selectedReservation.listingCategory === "Homes"
                          ? `${selectedReservation.checkIn} → ${selectedReservation.checkOut}`
                          : selectedReservation.checkIn}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-olive-dark/10 to-olive-dark/5 rounded-xl p-4 border border-olive-dark/20">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-olive-dark">Total Amount:</span>
                      <span className="text-2xl font-bold text-olive-dark">
                        ₱{selectedReservation.totalAmount?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  {selectedReservation.status === "Cancellation Requested" ? (
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={async () => {
                          try {
                            const resRef = doc(db, "reservations", selectedReservation.id);
                            await updateDoc(resRef, { status: "Cancelled" });

                            let guestData = null;
                            const guestRef = doc(db, "users", selectedReservation.guestId);
                            const guestSnap = await getDoc(guestRef);
                            if (guestSnap.exists()) {
                              guestData = guestSnap.data();
                            }

                            let listingData = null;
                            if (selectedReservation.listingId) {
                              const listingRef = doc(db, "listings", selectedReservation.listingId);
                              const listingSnap = await getDoc(listingRef);
                              if (listingSnap.exists()) {
                                listingData = listingSnap.data();
                              }
                            }

                            let hostData = null;
                            const hostRef = doc(db, "users", selectedReservation.hostId);
                            const hostSnap = await getDoc(hostRef);
                            if (hostSnap.exists()) {
                              hostData = hostSnap.data();
                            }

                            // Send email notification based on category
                            if (listingData.superCategory === "Homes") {
                              await axios.post(
                                "https://custom-email-backend.onrender.com/send-cancellation-email",
                                {
                                  guestEmail: guestData.email,
                                  guestName: guestData.name || guestData.fullName,
                                  listingTitle: listingData.title,
                                  hostName: hostData.fullName || hostData.name || "Host",
                                  checkIn: selectedReservation.checkIn,
                                  checkOut: selectedReservation.checkOut,
                                  totalAmount: selectedReservation.totalAmount,
                                  reservationId: selectedReservation.id,
                                },
                                { headers: { "Content-Type": "application/json" } }
                              );
                            } else if (listingData.superCategory === "Experiences") {
                              await axios.post(
                                "https://custom-email-backend.onrender.com/send-cancellation-email-experiences",
                                {
                                  guestEmail: guestData.email,
                                  guestName: guestData.name || guestData.fullName,
                                  listingTitle: listingData.title,
                                  hostName: hostData.fullName || hostData.name || "Host",
                                  bookedDate: selectedReservation.checkIn,
                                  totalAmount: selectedReservation.totalAmount,
                                  reservationId: selectedReservation.id,
                                },
                                { headers: { "Content-Type": "application/json" } }
                              );
                            } else if (listingData.superCategory === "Services") {
                              await axios.post(
                                "https://custom-email-backend.onrender.com/send-cancellation-email-services",
                                {
                                  guestEmail: guestData.email,
                                  guestName: guestData.name || guestData.fullName,
                                  listingTitle: listingData.title,
                                  hostName: hostData.fullName || hostData.name || "Host",
                                  bookedDate: selectedReservation.checkIn || selectedReservation.bookedDate,
                                  totalAmount: selectedReservation.totalAmount,
                                  reservationId: selectedReservation.id,
                                },
                                { headers: { "Content-Type": "application/json" } }
                              );
                            }

                            alert("Cancellation approved and guest notified.");
                            closeModal();
                          } catch (error) {
                            console.error("Error approving cancellation:", error);
                            alert("Failed to approve cancellation.");
                          }
                        }}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:from-green-700 hover:to-green-600 transition-all duration-200 hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approve Request
                      </button>

                      <button
                        onClick={async () => {
                          try {
                            const resRef = doc(db, "reservations", selectedReservation.id);
                            await updateDoc(resRef, { status: "Confirmed" });
                            alert("Cancellation request declined.");
                            closeModal();
                          } catch (error) {
                            console.error("Error declining cancellation:", error);
                            alert("Failed to decline request.");
                          }
                        }}
                        className="flex-1 bg-gradient-to-r from-red-500 to-red-400 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:from-red-600 hover:to-red-500 transition-all duration-200 hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <X size={18} />
                        Decline Request
                      </button>
                    </div>
                  ) : selectedReservation.status !== "Cancelled" ? (
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 flex items-center justify-center gap-2 bg-olive-dark text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-olive-dark/90 transition-all duration-200 hover:shadow-lg hover:scale-105"
                      >
                        <Edit size={18} /> Edit Details
                      </button>
                      <button
                        onClick={cancelReservation}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-400 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:from-red-600 hover:to-red-500 transition-all duration-200 hover:shadow-lg hover:scale-105"
                      >
                        <Trash size={18} /> Cancel Booking
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Number of Guests:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editedGuests}
                      onChange={(e) => setEditedGuests(parseInt(e.target.value))}
                      className="border-2 border-gray-200 focus:border-olive-dark focus:ring-2 focus:ring-olive-dark/20 rounded-xl w-full p-3 transition-all duration-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Select New Dates:
                    </label>
                    <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                      <DateRange
                        ranges={dateRange}
                        onChange={(item) => setDateRange([item.selection])}
                        moveRangeOnFirstSelection={false}
                        rangeColors={["#556b2f"]}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={saveChanges}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:from-green-700 hover:to-green-600 transition-all duration-200 hover:shadow-lg hover:scale-105"
                    >
                      <Save size={18} /> Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default Reservations;
