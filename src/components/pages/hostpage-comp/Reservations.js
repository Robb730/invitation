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
        const q = query(collection(db, "reservations"), where("hostId", "==", hostId));
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
                listingCategory = listingSnap.data().superCategory || "Unknown Category";
              }
            }

            if (reservation.guestId) {
              const guestRef = doc(db, "users", reservation.guestId);
              const guestSnap = await getDoc(guestRef);
              if (guestSnap.exists()) {
                const guestData = guestSnap.data();
                guestName = guestData.name || guestData.fullName || "Unknown Guest";
                guestPic = guestData.profilePic || guestData.photoURL || null;
              }
            }

            return { ...reservation, listingTitle, listingCategory, guestName, guestPic };
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
    else setFilteredReservations(reservations.filter((r) => r.status === filter));
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
    const confirmCancel = window.confirm("Are you sure you want to cancel this reservation?");
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

  return (<div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-5xl mx-auto mt-10 min-h-[70vh]"> <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6"> <h2 className="text-2xl font-semibold text-olive-dark">Reservations</h2>

    {/* 🔹 Filter Buttons */}
    <div className="flex gap-2 mt-4 md:mt-0">
      {["all", "Confirmed", "Completed", "Cancelled", "Cancellation Requested"].map((type) => (
        <button
          key={type}
          onClick={() => setFilter(type)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition ${filter === type
            ? "bg-olive-dark text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          <Filter size={14} /> {type === "Cancellation Requested" ? "Cancellation Requests" : type.charAt(0).toUpperCase() + type.slice(1)}

        </button>
      ))}
    </div>
  </div>

    {loading ? (
      <div className="text-gray-500 text-center py-10 animate-pulse">
        Loading reservations...
      </div>
    ) : filteredReservations.length === 0 ? (
      <div className="border border-gray-200 rounded-2xl p-8 text-center text-gray-500 bg-gray-50">
        No {filter === "all" ? "" : filter} reservations found.
      </div>
    ) : (
      <div className="grid gap-6">
        {filteredReservations.map((reservation) => (
          <div
            key={reservation.id}
            className="bg-beige hover:bg-olive-light/20 border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
              <h3 className="text-lg font-semibold text-olive-dark">
                {reservation.listingTitle}
              </h3>
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full mt-2 md:mt-0 ${reservation.status === "Confirmed"
                  ? "bg-green-100 text-green-700"
                  : reservation.status === "Cancellation Requested"
                    ? "bg-yellow-100 text-yellow-700"
                    : reservation.status === "Completed" 
                    ? "bg-blue-100 text-blue-700"
                    : "bg-red-100 text-red-700"
                  }`}
              >
                {reservation.status || "Pending"}
              </span>
            </div>

            <div className="text-gray-600 grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <p className="flex items-center gap-2">
                <User size={16} /> {reservation.guestName}
              </p>
              {reservation.listingCategory === "Homes" && (
                <p className="flex items-center text-gray-600 gap-x-2">
                  <Calendar size={16} className="text-gray-500" />
                  {reservation.checkIn} → {reservation.checkOut}
                </p>
              )}{reservation.listingCategory !== "Homes" && (
                <p className="flex items-center text-gray-600 gap-x-2">
                  <Calendar size={16} className="text-gray-500" />
                  {reservation.checkIn}
                </p>
              )}

              <p className="flex items-center gap-2">
                <Clock size={16} />{" "}
                {reservation.createdAt?.toDate
                  ? reservation.createdAt.toDate().toLocaleDateString()
                  : new Date(reservation.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-4">
              <p className="font-semibold text-olive-dark">
                Total: ₱{reservation.totalAmount?.toLocaleString() || 0}
              </p>
              <button
                onClick={() => openModal(reservation)}
                className="mt-3 md:mt-0 bg-olive-dark text-white text-sm px-4 py-2 rounded-xl hover:bg-olive-dark/90 transition"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* 🔹 Modal */}
    {showModal && selectedReservation && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl w-[90%] max-w-md p-6 relative overflow-y-auto max-h-[90vh]">
          <button
            onClick={closeModal}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>

          <h3 className="text-xl font-semibold text-olive-dark mb-4 text-center">
            {selectedReservation.listingTitle}
          </h3>

          <div className="flex flex-col items-center mb-4">
            {selectedReservation.guestPic ? (
              <img
                src={selectedReservation.guestPic}
                alt="Guest"
                className="w-20 h-20 rounded-full object-cover mb-2"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                <User size={30} className="text-gray-500" />
              </div>
            )}
            <p className="font-medium text-gray-700">{selectedReservation.guestName}</p>
            <span
              className={`mt-2 text-xs font-semibold px-3 py-1 rounded-full ${selectedReservation.status === "Confirmed"
                ? "bg-green-100 text-green-700"
                : selectedReservation.status === "pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
                }`}
            >
              {selectedReservation.status || "Pending"}
            </span>
          </div>

          {!isEditing ? (
            <div className="text-gray-600 space-y-2">
              <p>
                <span className="font-medium text-olive-dark">Reservation Created:</span>{" "}
                {selectedReservation.createdAt?.toDate
                  ? selectedReservation.createdAt.toDate().toLocaleString()
                  : new Date(selectedReservation.createdAt).toLocaleString()}
              </p>
              <p>
                <span className="font-medium text-olive-dark">Discount Applied:</span>{" "}
                {selectedReservation.discountApplied
                  ? `${selectedReservation.discountApplied}%`
                  : "No discount"}
              </p>
              <p>
                <span className="font-medium text-olive-dark">Guests:</span>{" "}
                {selectedReservation.guests || 1}
              </p>


              {selectedReservation.listingCategory === "Homes" ? (
                <p>
                  <span className="font-medium text-olive-dark">Check-in / Check-out:</span>{" "}
                  {selectedReservation.checkIn} → {selectedReservation.checkOut}
                </p>
              ) : (
                <p>
                  <span className="font-medium text-olive-dark">Schedule:</span>{" "}
                  {selectedReservation.checkIn}
                </p>
              )}


              <p>
                <span className="font-medium text-olive-dark">Total Amount:</span>{" "}
                ₱{selectedReservation.totalAmount?.toLocaleString() || 0}
              </p>

              {/* Hide edit/cancel buttons if cancelled */}
              {/* 🔹 Host actions depending on status */}
{selectedReservation.status === "Cancellation Requested" ? (
  <div className="flex justify-between mt-6">
    <button
      onClick={async () => {
        try {
          const resRef = doc(db, "reservations", selectedReservation.id);
          await updateDoc(resRef, { status: "Cancelled" });

          let guestData = null;
          const guestRef = doc(db, "users", selectedReservation.guestId);
          const guestSnap = await getDoc(guestRef);
          if(guestSnap.exists()){
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
          if(hostSnap.exists()){
            hostData = hostSnap.data();
          }
          console.log("Guest Name:", guestData.name || guestData.fullName);
          console.log("Listing Name:", listingData.title);
          console.log("Host Name:", hostData.fullName || hostData.name);

          console.log("listingData Cat:", listingData.superCategory);
          
          // 🔹 Send email notification
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
      className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700"
    >
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
      className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-red-600"
    >
      Decline Request
    </button>
  </div>
) : selectedReservation.status !== "Cancelled" ? (
  <div className="flex justify-between mt-6">
    <button
      onClick={() => setIsEditing(true)}
      className="flex items-center gap-2 bg-olive-dark text-white px-4 py-2 rounded-xl text-sm hover:bg-olive-dark/90"
    >
      <Edit size={16} /> Edit
    </button>
    <button
      onClick={cancelReservation}
      className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-red-600"
    >
      <Trash size={16} /> Cancel
    </button>
  </div>
) : null}

            </div>
          ) : (
            <div className="text-gray-700 space-y-3">
              <label className="block text-sm font-medium text-olive-dark">
                Number of Guests:
              </label>
              <input
                type="number"
                min="1"
                value={editedGuests}
                onChange={(e) => setEditedGuests(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg w-full p-2"
              />

              <label className="block text-sm font-medium text-olive-dark mt-3">
                Select New Dates:
              </label>
              <DateRange
                ranges={dateRange}
                onChange={(item) => setDateRange([item.selection])}
                moveRangeOnFirstSelection={false}
                rangeColors={["#556b2f"]}
              />

              <div className="flex justify-between mt-5">
                <button
                  onClick={saveChanges}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700"
                >
                  <Save size={16} /> Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </div>


  );
};

export default Reservations;
