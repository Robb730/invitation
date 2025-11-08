import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
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
      ? (
          reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        ).toFixed(1)
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
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-olive rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600 text-lg animate-pulse">
          Loading dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="sm:p-2 md:p-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-olive-dark">
            Welcome back, Host!
          </h1>
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-olive-dark tracking-tight mb-1">
              Recent Reservations
            </h2>
            <p className="text-sm text-gray-600">
              {recentReservations.length}{" "}
              {recentReservations.length === 1 ? "reservation" : "reservations"}{" "}
              in the last 30 days
            </p>
          </div>

          <button
            onClick={() => setActivePage("Reservations")}
            className="flex items-center gap-2 px-4 py-2.5 text-[#3a3a2e] font-medium text-sm bg-white/80 hover:bg-white border border-white/60 rounded-xl hover:shadow-md transition-all duration-200 backdrop-blur-sm"
          >
            <span>View All</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl shadow-xl border border-white/50 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl">
          <table className="w-full text-sm md:text-base">
            <thead>
              <tr className="bg-gradient-to-r from-olive-dark/5 to-olive-dark/10 border-b border-gray-200/50">
                <th className="py-5 px-6 text-left text-xs font-bold text-olive-dark/70 uppercase tracking-wider">
                  Guest Information
                </th>
                <th className="py-5 px-6 text-left text-xs font-bold text-olive-dark/70 uppercase tracking-wider">
                  Property
                </th>
                <th className="py-5 px-6 text-left text-xs font-bold text-olive-dark/70 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200/30">
              {recentReservations.length > 0 ? (
                recentReservations.map((r, i) => (
                  <tr
                    key={r.id}
                    className="group transition-all duration-200 hover:bg-white/90 hover:shadow-sm"
                  >
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-olive-dark/20 to-olive-dark/10 flex items-center justify-center text-olive-dark font-semibold text-sm shadow-sm">
                          {r.guestName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-olive-dark group-hover:text-olive-dark/80 transition-colors">
                            {r.guestName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          />
                        </svg>
                        <span className="text-[#56564d] font-medium">
                          {r.listingName}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 ${
                          r.status?.toLowerCase() === "confirmed"
                            ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200/50"
                            : r.status?.toLowerCase() === "completed"
                            ? "bg-gradient-to-r from-blue-50 to-sky-50 text-blue-700 border border-blue-200/50"
                            : r.status?.toLowerCase() === "cancellation requested"
                            ? "bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border border-orange-200/50"
                            : "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200/50"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            r.status?.toLowerCase() === "confirmed"
                              ? "bg-green-500"
                              : r.status?.toLowerCase() === "completed"
                              ? "bg-blue-500"
                              : "bg-red-500"
                          }`}
                        />
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">
                          No recent reservations
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          New reservations will appear here
                        </p>
                      </div>
                    </div>
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
