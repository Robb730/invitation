import React, { useState, useEffect } from "react";
import logo from "./homepage-comp/images/kubohublogo_olive.svg";
import { db } from "../../firebaseConfig";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit,
} from "firebase/firestore";

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState([
    { label: "Active Listings", value: 0, icon: "🏠", color: "from-blue-500 to-cyan-600" },
    { label: "Total Bookings", value: 0, icon: "📅", color: "from-purple-500 to-pink-600" },
    { label: "Total Users", value: 0, icon: "👥", color: "from-orange-500 to-red-600" },
  ]);

  const [recentReservations, setRecentReservations] = useState([]);
  const [lowestRatedListing, setLowestRatedListing] = useState(null);
  const [highestRatedListing, setHighestRatedListing] = useState(null);

  const [lowestReviews, setLowestReviews] = useState([]);
  const [bestReviews, setBestReviews] = useState([]);

  const auth = getAuth();

  // 🔹 Load admin data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setAdminData(null);
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAdminData({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.warn("No admin document found in Firestore for this user.");
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  // 🔹 Fetch Dashboard Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // ✅ Active Listings
        const activeListingsSnap = await getDocs(query(collection(db, "listings"), where("status", "==", "Active")));
        const activeListingCount = activeListingsSnap.size;

        // ✅ Total Bookings
        const bookingsSnap = await getDocs(collection(db, "reservations"));
        const totalBookings = bookingsSnap.size;

        // ✅ Total Users (excluding admin)
        const usersSnap = await getDocs(collection(db, "users"));
        const totalUsers = usersSnap.size - 1;

        setStats([
          { label: "Active Listings", value: activeListingCount, icon: "🏠", color: "from-blue-500 to-cyan-600" },
          { label: "Total Bookings", value: totalBookings, icon: "📅", color: "from-purple-500 to-pink-600" },
          { label: "Total Users", value: totalUsers, icon: "👥", color: "from-orange-500 to-red-600" },
        ]);

        // --------------------------
        // 1️⃣ Recent Reservations
        // --------------------------
        const recentReservationsQuery = query(
          collection(db, "reservations"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const recentSnap = await getDocs(recentReservationsQuery);
        const reservationsData = recentSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRecentReservations(reservationsData);

        // --------------------------
        // 2️⃣ Ratings
        // --------------------------
        const ratingsSnap = await getDocs(collection(db, "ratings"));
        const ratings = ratingsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Compute average ratings per listing
        const ratingMap = {};
        ratings.forEach((r) => {
          if (!ratingMap[r.listingId]) ratingMap[r.listingId] = { total: 0, count: 0, reviews: [] };
          ratingMap[r.listingId].total += r.rating;
          ratingMap[r.listingId].count += 1;
          ratingMap[r.listingId].reviews.push(r);
        });

        const listingsRatings = Object.entries(ratingMap).map(([listingId, data]) => ({
          listingId,
          avgRating: data.total / data.count,
          reviews: data.reviews,
          count: data.count,
        }));

        // Booking count per listing
        const bookingMap = {};
        bookingsSnap.docs.forEach((doc) => {
          const d = doc.data();
          if (!bookingMap[d.listingId]) bookingMap[d.listingId] = 0;
          bookingMap[d.listingId] += 1;
        });

        // Combine ratings + bookings
        const listingsStats = listingsRatings.map((l) => ({
          ...l,
          bookings: bookingMap[l.listingId] || 0,
        }));

        // Lowest Rated & Least Booked
        listingsStats.sort((a, b) => a.avgRating - b.avgRating || a.bookings - b.bookings);
        const lowest = listingsStats[0];
        if (lowest) {
          const lowestSnap = await getDocs(query(collection(db, "listings"), where("__name__", "==", lowest.listingId)));
          setLowestRatedListing(lowestSnap.docs[0]?.data() || null);
          setLowestReviews(lowest.reviews.sort((a,b)=>a.rating-b.rating).slice(0,3));
        }

        // Highest Rated & Most Booked
        listingsStats.sort((a, b) => b.avgRating - a.avgRating || b.bookings - a.bookings);
        const highest = listingsStats[0];
        if (highest) {
          const highestSnap = await getDocs(query(collection(db, "listings"), where("__name__", "==", highest.listingId)));
          setHighestRatedListing(highestSnap.docs[0]?.data() || null);
          setBestReviews(highest.reviews.sort((a,b)=>b.rating-a.rating).slice(0,3));
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  // 🔸 Loading
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading admin dashboard...</div>;
  if (!adminData) return <div className="min-h-screen flex items-center justify-center">Please log in as an admin.</div>;

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-600 text-sm font-medium mb-1">{stat.label}</p>
                      <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
                    </div>
                    <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Reservations */}
            <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Recent Reservations</h2>
              <ul className="space-y-2">
                {recentReservations.map(r => (
                  <li key={r.id} className="border-b py-2">
                    {r.guestName || "Guest"} booked {r.listingName || "Listing"} on {r.createdAt?.toDate?.()?.toLocaleDateString() || "—"}
                  </li>
                ))}
                {recentReservations.length === 0 && <p>No recent reservations</p>}
              </ul>
            </div>

            {/* Lowest / Highest Rated Listings */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lowest */}
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Lowest Rated Listing</h2>
                {lowestRatedListing ? (
                  <>
                    <p className="font-medium">{lowestRatedListing.name}</p>
                    <p className="text-gray-600">Rating: {lowestRatedListing.rating || "N/A"}</p>
                    <p className="text-gray-600">Bookings: {lowestRatedListing.bookings || "0"}</p>
                  </>
                ) : <p>No data</p>}
              </div>

              {/* Highest */}
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Highest Rated Listing</h2>
                {highestRatedListing ? (
                  <>
                    <p className="font-medium">{highestRatedListing.name}</p>
                    <p className="text-gray-600">Rating: {highestRatedListing.rating || "N/A"}</p>
                    <p className="text-gray-600">Bookings: {highestRatedListing.bookings || "0"}</p>
                  </>
                ) : <p>No data</p>}
              </div>
            </div>
          </>
        );
      case "reservations":
        return (
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-semibold mb-4">All Reservations</h2>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Guest</th>
                  <th className="py-2">Listing</th>
                  <th className="py-2">Date</th>
                  <th className="py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentReservations.length > 0 ? recentReservations.map(r => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">{r.guestName || "—"}</td>
                    <td className="py-2">{r.listingName || "—"}</td>
                    <td className="py-2">{r.createdAt?.toDate?.()?.toLocaleDateString() || "—"}</td>
                    <td className="py-2 text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${r.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {r.status || "Pending"}
                      </span>
                    </td>
                  </tr>
                )) : <tr><td colSpan="4" className="py-3 text-center text-gray-500">No bookings</td></tr>}
              </tbody>
            </table>
          </div>
        );
      case "reviews":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lowest */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Lowest Reviews</h2>
              {lowestReviews.length > 0 ? (
                <ul className="space-y-3">
                  {lowestReviews.map(r => (
                    <li key={r.id} className="border p-3 rounded-lg hover:bg-gray-50 transition">
                      <p className="font-medium">{r.guestName || "Anonymous"} – ⭐ {r.rating}</p>
                      <p className="text-sm text-gray-600">{r.comment}</p>
                    </li>
                  ))}
                </ul>
              ) : <p>No reviews</p>}
            </div>

            {/* Best */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Best Reviews</h2>
              {bestReviews.length > 0 ? (
                <ul className="space-y-3">
                  {bestReviews.map(r => (
                    <li key={r.id} className="border p-3 rounded-lg hover:bg-gray-50 transition">
                      <p className="font-medium">{r.guestName || "Anonymous"} – ⭐ {r.rating}</p>
                      <p className="text-sm text-gray-600">{r.comment}</p>
                    </li>
                  ))}
                </ul>
              ) : <p>No reviews</p>}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header + Tabs */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg flex items-center justify-center">
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-olive to-olive-darker bg-clip-text text-transparent">
                KuboHub <span className="font-thin">Admin</span>
              </h1>
              <p className="text-xs text-gray-500">Manage your platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-semibold">{adminData?.name || "Admin User"}</p>
                <p className="text-xs text-gray-500">{adminData?.email || "admin@platform.com"}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="px-6 flex gap-1 overflow-x-auto">
          {["dashboard", "reservations", "reviews"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium text-sm transition-all whitespace-nowrap ${activeTab===tab ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">{renderTabContent()}</main>
    </div>
  );
};

export default AdminPage;
