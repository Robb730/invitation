import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { Star, Calendar, Home, Wallet } from "lucide-react";

const Dashboard = ({ setActivePage }) => {
  const [host, setHost] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [recentReservations, setRecentReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setHost(user);
        await fetchHostData(user.uid);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  console.log(host);
  const fetchHostData = async (hostId) => {
    try {
      const reservationsRef = collection(db, "reservations");
      const q1 = query(reservationsRef, where("hostId", "==", hostId));
      const resSnap = await getDocs(q1);
      const reservationsData = resSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // ✅ Count only completed bookings
const completedBookings = reservationsData.filter(
  (r) => r.status?.toLowerCase() === "completed"
);
setBookings(completedBookings);


      const totalEarnings = reservationsData.reduce(
        (sum, r) => sum + (r.totalAmount || 0),
        0
      );
      setEarnings(totalEarnings);

      const listingsRef = collection(db, "listings");
      const q2 = query(listingsRef, where("hostId", "==", hostId));
      const listingsSnap = await getDocs(q2);
      const listingsData = listingsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setListings(listingsData);

      const ratingsRef = collection(db, "ratings");
      const ratingsSnap = await getDocs(ratingsRef);
      const ratingsData = ratingsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const hostRatings = ratingsData.filter((r) =>
        listingsData.some((l) => l.id === r.listingId)
      );
      setReviews(hostRatings);

      const enrichedReservations = await Promise.all(
        reservationsData.map(async (r) => {
          let guestName = "Unknown";
          let listingName = "Unknown";
          if (r.guestId) {
            const guestDoc = await getDoc(doc(db, "users", r.guestId));
            if (guestDoc.exists()) {
              const guestData = guestDoc.data();
              guestName = guestData.name || "Guest";
            }
          }
          if (r.listingId) {
            const listingDoc = await getDoc(doc(db, "listings", r.listingId));
            if (listingDoc.exists()) {
              listingName = listingDoc.data().title || "Listing";
            }
          }
          return { ...r, guestName, listingName };
        })
      );

      const sortedReservations = [...enrichedReservations].sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
      setRecentReservations(sortedReservations.slice(0, 3));

      const bookingsCount = {};
      reservationsData.forEach((r) => {
        if (r.listingId) {
          bookingsCount[r.listingId] = (bookingsCount[r.listingId] || 0) + 1;
        }
      });

      setListings((prev) =>
        prev.map((l) => ({
          ...l,
          bookings: bookingsCount[l.id] || 0,
        }))
      );
    } catch (error) {
      console.error("Error fetching host data:", error);
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : "0";

  const stats = [
  {
    value: bookings.length,
    label: "Total Completed Bookings", // ✅ Updated label
    icon: <Calendar className="w-5 h-5 text-white/90" />,
    color: "from-blue-400 to-blue-600",
  },
  {
    value: `₱${earnings.toLocaleString()}`,
    label: "Total Earnings",
    icon: <Wallet className="w-5 h-5 text-white/90" />,
    color: "from-emerald-400 to-emerald-600",
  },
  {
    value: listings.length,
    label: "Active Listings",
    icon: <Home className="w-5 h-5 text-white/90" />,
    color: "from-orange-400 to-orange-600",
  },
  {
    value: avgRating,
    label: "Reviews",
    icon: <Star className="w-5 h-5 text-white/90" />,
    color: "from-yellow-400 to-yellow-600",
  },
];


  if (loading) {
    return (
      <div className="text-center mt-10 text-gray-600 animate-pulse">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="sm:p-2 md:p-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-olive-dark">Welcome back, Host!</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Here’s an overview of your listings and bookings.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`rounded-2xl shadow-md text-white bg-gradient-to-r ${stat.color} p-6 flex flex-col gap-3 transition-transform transform hover:scale-[1.03]`}
          >
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="p-2 bg-white/20 rounded-lg">{stat.icon}</div>
            </div>
            <p className="text-sm font-medium opacity-90">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 🌿 Recent Reservations Section */}
<div className="mt-12">
  <div className="flex justify-between items-center mb-5">
    <h2 className="text-3xl font-bold text-olive-dark tracking-tight">
      Recent Reservations
    </h2>

    <button
      onClick={() => setActivePage("Reservations")}
      className="text-[#3a3a2e] font-medium text-sm hover:text-[#565646] hover:underline transition-colors"
    >
      View All →
    </button>
  </div>

  <div className="overflow-hidden rounded-2xl shadow-lg border border-white/40 bg-white/70 backdrop-blur-xl transition-all">
    <table className="w-full text-sm md:text-base text-olive-dark">
      <thead>
        <tr className="bg-gradient-to-r from-white/80 to-white/60 text-olive-dark font-semibold uppercase tracking-wide text-xs md:text-sm">
          <th className="py-4 px-5 text-left">Guest</th>
          <th className="py-4 px-5 text-left">Property</th>
          <th className="py-4 px-5 text-left">Status</th>
        </tr>
      </thead>

      <tbody>
        {recentReservations.length > 0 ? (
          recentReservations.map((r, i) => (
            <tr
              key={r.id}
              className={`transition-colors duration-200 ${
                i % 2 === 0
                  ? "bg-white/60 hover:bg-white/80"
                  : "bg-white/50 hover:bg-white/70"
              }`}
            >
              <td className="py-4 px-5 font-medium text-olive-dark">
                {r.guestName}
              </td>
              <td className="py-4 px-5 text-[#56564d]">{r.listingName}</td>
              <td className="py-4 px-5">
                <span
                  className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${
                    r.status?.toLowerCase() === "confirmed"
                      ? "bg-green-100 text-green-700"
                      : r.status?.toLowerCase() === "completed"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {r.status}
                </span>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan="3"
              className="text-center py-6 text-gray-500 italic tracking-wide"
            >
              No recent reservations found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>


      {/* Most Popular Listings */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-olive-dark mb-6">
          Most Popular Listings
        </h2>

        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings
              .sort((a, b) => (b.bookings || 0) - (a.bookings || 0))
              .slice(0, 3)
              .map((listing, index) => (
                <div
                  key={listing.id}
                  className="group bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={
                        listing.images?.[0] ||
                        `https://source.unsplash.com/600x400/?apartment,interior`
                      }
                      alt={listing.title || "Listing image"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Ranking Badge */}
                    <span className="absolute top-3 left-3 bg-olive-dark text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="p-5 text-olive-dark">
                    <h3 className="font-semibold text-lg truncate">
                      {listing.title || listing.name || "Untitled Listing"}
                    </h3>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium text-olive-dark/90">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          className="w-4 h-4 text-olive-dark"
                        >
                          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05C16.12 14.1 18 15.28 18 16.5V19h5v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                        </svg>
                        {listing.bookings || 0} Guest
                        {listing.bookings > 1 ? "s" : ""} Booked
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 italic text-sm text-center mt-6">
            No listings found.
          </p>
        )}
      </div>


    </div>
  );
};

export default Dashboard;
