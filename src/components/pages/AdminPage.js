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
import {
  Users,
  Home,
  Calendar,
  TrendingUp,
  TrendingDown,
  Search,
  ChevronRight,
  TrendingUpDown,
  Trophy,
  Medal,
  Star,
} from "lucide-react";
import RewardsAdminPanel from "./admin-comp/RewardsAdminPanel";

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState([]);

  const [recentReservations, setRecentReservations] = useState([]);
  const [allReservations, setAllReservations] = useState([]);

  const [lowestRatedListing, setLowestRatedListing] = useState(null);
  const [highestRatedListing, setHighestRatedListing] = useState(null);

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

  const [searchQuery, setSearchQuery] = useState("");

  // Filter reservations in real-time
  const filteredReservations = allReservations.filter((r) => {
    const query = searchQuery.toLowerCase();
    return (
      r.guestName?.toLowerCase().includes(query) ||
      r.hostName?.toLowerCase().includes(query) ||
      r.listingName?.toLowerCase().includes(query) ||
      r.status?.toLowerCase().includes(query)
    );
  });

  const getStatusStyles = (status) => {
    const styles = {
      confirmed: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-600/20",
      completed: "bg-blue-100 text-blue-700 ring-1 ring-blue-600/20",
      pending: "bg-amber-100 text-amber-700 ring-1 ring-amber-600/20",
      cancelled: "bg-red-100 text-red-700 ring-1 ring-red-600/20",
      "cancellation requested":
        "bg-orange-100 text-orange-700 ring-1 ring-orange-600/20",
    };
    return (
      styles[status?.toLowerCase()] ||
      "bg-gray-100 text-gray-700 ring-1 ring-gray-600/20"
    );
  };

  // 🔹 Fetch Dashboard Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // ✅ Active Listings Count
        const activeListingsSnap = await getDocs(
          query(collection(db, "listings"), where("status", "==", "Active"))
        );
        const activeListingCount = activeListingsSnap.size;

        // ✅ All Reservations
        const reservationsRef = collection(db, "reservations");
        const allReservationsSnap = await getDocs(reservationsRef);
        const allReservations = allReservationsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // ✅ Total Bookings (Confirmed/Completed only)
        const validStatuses = ["confirmed", "completed"];
        const totalBookings = allReservations.filter((r) =>
          validStatuses.includes(r.status?.toLowerCase())
        ).length;

        // ✅ Total Users
        const usersSnap = await getDocs(collection(db, "users"));
        const totalUsers = usersSnap.size - 1;

        // Query all active listings TODAY (no time needed)
        const listingsRef = collection(db, "listings");

        const q = query(listingsRef, where("status", "==", "Active"));
        const snapshot = await getDocs(q);

        const today = new Date();
        const todayDateString = today.toDateString(); // e.g. "Sun Nov 09 2025"

        // Filter by same calendar date
        const todaysActiveListings = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((listing) => {
            if (!listing.createdAt) return false;
            // Convert Firestore Timestamp to JS Date
            const createdDate = listing.createdAt.toDate();
            return createdDate.toDateString() === todayDateString;
          });
        const activeListingsToday = todaysActiveListings.length;

        console.log("Today's active listings:", todaysActiveListings);

        console.log(activeListingsToday);
        let trend = "";
        if (activeListingsToday > 0) {
          trend = "up";
        } else {
          trend = "middle";
        }

        // Query all active reservations TODAY (no time needed)
        const reserveRef = collection(db, "reservations");

        const res = query(
          reserveRef,
          where("status", "in", ["Confirmed", "Completed"])
        );
        const resSnapshot = await getDocs(res);

        // e.g. "Sun Nov 09 2025"

        // Filter by same calendar date
        const todaysReservations = resSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((reservation) => {
            if (!reservation.createdAt) return false;
            // Convert Firestore Timestamp to JS Date
            const createdDate = reservation.createdAt.toDate();
            return createdDate.toDateString() === todayDateString;
          });
        const reservationsToday = todaysReservations.length;

        console.log("Today's reservations:", todaysReservations);

        console.log(reservationsToday);
        let trend2 = "";
        if (reservationsToday > 0) {
          trend2 = "up";
        } else {
          trend2 = "middle";
        }

        // Query all added users TODAY (no time needed)
        const usersRef = collection(db, "users");

        
        const userSnapshot = await getDocs(usersRef);

        // e.g. "Sun Nov 09 2025"

        // Filter by same calendar date
        const todaysUsers = userSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((userzs) => {
            if (!userzs.createdAt) return false;
            // Convert Firestore Timestamp to JS Date
            const createdDate = userzs.createdAt.toDate();
            return createdDate.toDateString() === todayDateString;
          });
        const usersToday = todaysUsers.length;

        console.log("Today's added users:", todaysUsers);

        console.log(usersToday);
        let trend3 = "";
        if (usersToday > 0) {
          trend3 = "up";
        } else {
          trend3 = "middle";
        }

        // ✅ Update Stats
        setStats([
          {
            label: "Active Listings",
            value: activeListingCount,
            icon: Home,
            color: "from-blue-500 to-cyan-600",
            today: activeListingsToday,
            trend: trend,
          },
          {
            label: "Total Bookings",
            value: totalBookings,
            icon: Calendar,
            color: "from-purple-500 to-pink-600",
            today: reservationsToday,
            trend: trend2,
          },
          {
            label: "Total Users",
            value: totalUsers,
            icon: Users,
            color: "from-orange-500 to-red-600",
            today: usersToday,
            trend: trend3,
          },
        ]);

        // ✅ Recent 5 Reservations (with user & listing data)
        const recentReservationsQuery = query(
          reservationsRef,
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const recentSnap = await getDocs(recentReservationsQuery);

        const recentReservationsData = await Promise.all(
          recentSnap.docs.map(async (docSnap) => {
            const data = docSnap.data();
            let guestName = "Unknown Guest";
            let hostName = "Unknown Host";
            let listingName = "Unknown Listing";

            // Guest
            if (data.guestId) {
              const guestSnap = await getDoc(doc(db, "users", data.guestId));
              if (guestSnap.exists())
                guestName =
                  guestSnap.data().name ||
                  guestSnap.data().fullName ||
                  "Unnamed Guest";
            }

            // Host
            if (data.hostId) {
              const hostSnap = await getDoc(doc(db, "users", data.hostId));
              if (hostSnap.exists())
                hostName = hostSnap.data().fullName || "Unnamed Host";
            }

            // Listing
            if (data.listingId) {
              const listingSnap = await getDoc(
                doc(db, "listings", data.listingId)
              );
              if (listingSnap.exists())
                listingName = listingSnap.data().title || "Untitled Listing";
            }

            return {
              id: docSnap.id,
              ...data,
              guestName,
              hostName,
              listingName,
            };
          })
        );
        setRecentReservations(recentReservationsData);

        // ✅ Compute Most & Least Booked Listings (Confirmed/Completed only)
        const bookingCounts = {};
        allReservations.forEach((r) => {
          if (r.listingId && validStatuses.includes(r.status?.toLowerCase())) {
            bookingCounts[r.listingId] = (bookingCounts[r.listingId] || 0) + 1;
          }
        });

        const sortedByBookings = Object.entries(bookingCounts).sort(
          (a, b) => b[1] - a[1]
        );

        let mostBookedListing = null;
        let leastBookedListing = null;

        if (sortedByBookings.length > 0) {
          const [mostId, mostCount] = sortedByBookings[0];
          const [leastId, leastCount] =
            sortedByBookings[sortedByBookings.length - 1];

          // ✅ Corrected: fetch from "listings" (not "reservations")
          const mostSnap = await getDoc(doc(db, "listings", mostId));
          const leastSnap = await getDoc(doc(db, "listings", leastId));

          if (mostSnap.exists())
            mostBookedListing = {
              id: mostSnap.id,
              ...mostSnap.data(),
              bookings: mostCount,
            };

          if (leastSnap.exists())
            leastBookedListing = {
              id: leastSnap.id,
              ...leastSnap.data(),
              bookings: leastCount,
            };
        }

        // ✅ Save to state
        setHighestRatedListing(mostBookedListing);
        setLowestRatedListing(leastBookedListing);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  // 🔹 Fetch All Reservations (for Reservations Tab)
  useEffect(() => {
    const fetchAllReservations = async () => {
      try {
        const reservationsRef = collection(db, "reservations");
        const allQuery = query(reservationsRef, orderBy("createdAt", "desc"));
        const snap = await getDocs(allQuery);

        const allReservationsData = await Promise.all(
          snap.docs.map(async (docSnap) => {
            const data = docSnap.data();
            let guestName = "Unknown Guest";
            let hostName = "Unknown Host";
            let listingName = "Unknown Listing";

            if (data.guestId) {
              const guestSnap = await getDoc(doc(db, "users", data.guestId));
              if (guestSnap.exists())
                guestName =
                  guestSnap.data().name ||
                  guestSnap.data().fullName ||
                  "Unnamed Guest";
            }

            if (data.hostId) {
              const hostSnap = await getDoc(doc(db, "users", data.hostId));
              if (hostSnap.exists())
                hostName = hostSnap.data().fullName || "Unnamed Host";
            }

            if (data.listingId) {
              const listingSnap = await getDoc(
                doc(db, "listings", data.listingId)
              );
              if (listingSnap.exists())
                listingName = listingSnap.data().title || "Untitled Listing";
            }

            return {
              id: docSnap.id,
              ...data,
              guestName,
              hostName,
              listingName,
            };
          })
        );

        setAllReservations(allReservationsData);
      } catch (err) {
        console.error("Error fetching all reservations:", err);
      }
    };

    fetchAllReservations();
  }, []);

  //for reviews
  const [leaderboard, setLeaderboard] = useState([]);

  const getRankIcon = (index) => {
    if (index === 0) {
      return <Trophy className="w-6 h-6 text-yellow-500" />;
    } else if (index === 1) {
      return <Medal className="w-6 h-6 text-gray-400" />;
    } else if (index === 2) {
      return <Medal className="w-6 h-6 text-amber-600" />;
    }
    return <span className="text-gray-500 font-semibold">{index + 1}</span>;
  };

  const getRankBadgeColor = (index) => {
    if (index === 0)
      return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200";
    if (index === 1)
      return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200";
    if (index === 2)
      return "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200";
    return "bg-white border-gray-100";
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Fetch ALL listings first
        const listingsSnap = await getDocs(collection(db, "listings"));
        const listings = listingsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // Fetch ALL ratings
        const ratingsSnap = await getDocs(collection(db, "ratings"));
        const ratings = ratingsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // Fetch ALL reservations
        const reservationSnap = await getDocs(collection(db, "reservations"));
        const reservations = reservationSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // Group ratings by listing
        const ratingMap = {};
        ratings.forEach((r) => {
          if (!ratingMap[r.listingId]) ratingMap[r.listingId] = [];
          ratingMap[r.listingId].push(r.rating);
        });

        // Count bookings (Confirmed/Completed)
        const bookingMap = {};
        reservations.forEach((res) => {
          if (!["confirmed", "completed"].includes(res.status?.toLowerCase()))
            return;
          bookingMap[res.listingId] = (bookingMap[res.listingId] || 0) + 1;
        });

        // Build leaderboard items FOR ALL LISTINGS
        const leaderboardData = listings.map((listing) => {
          const listingId = listing.id;

          const ratingsArr = ratingMap[listingId] || [];
          const avgRating =
            ratingsArr.length > 0
              ? ratingsArr.reduce((a, b) => a + b, 0) / ratingsArr.length
              : 0;

          return {
            listingId,
            title: listing.title || "Untitled",
            avgRating,
            reviewCount: ratingsArr.length,
            bookingCount: bookingMap[listingId] || 0,
          };
        });

        // Ranking priority: Rating → Bookings → Review Count
        leaderboardData.sort((a, b) => {
          if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
          if (b.bookingCount !== a.bookingCount)
            return b.bookingCount - a.bookingCount;
          return b.reviewCount - a.reviewCount;
        });

        setLeaderboard(leaderboardData);
      } catch (err) {
        console.error("Error building leaderboard:", err);
      }
    };

    fetchLeaderboard();
  }, []);

  // 🔸 Loading
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading admin dashboard...
      </div>
    );
  if (!adminData)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Please log in as an admin.
      </div>
    );

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={i}
                    className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 relative overflow-hidden"
                  >
                    {/* Background decoration */}
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.bgGradient} opacity-5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300`}
                    ></div>

                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <p className="text-gray-500 text-sm font-medium mb-2">
                            {stat.label}
                          </p>
                          <h3 className="text-4xl font-bold text-gray-900 mb-2">
                            {stat.value.toLocaleString()}
                          </h3>
                          <div className="flex items-center gap-1">
                            {stat.trend === "up" ? (
                              <TrendingUp className="w-4 h-4 text-emerald-500" />
                            ) : stat.trend === "middle" ? (
                              <TrendingUpDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-500" />
                            )}

                            <span
                              className={`text-sm font-medium ${
                                stat.trend === "up"
                                  ? "text-emerald-500"
                                  : "text-gray-500"
                              }`}
                            >
                              {stat.today}
                            </span>
                            <span className="text-gray-400 text-sm">
                              added today
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-16 h-16 bg-olive rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                        >
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-olive to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Recent Reservations
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Latest booking activity on the platform
                    </p>
                  </div>
                  <button onClick={() => setActiveTab("reservations")} className="px-4 py-2 text-sm font-medium text-olive-dark hover:bg-olive-dark hover:text-white rounded-lg transition-colors flex items-center gap-2">
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                {recentReservations.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Guest
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Host
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Listing
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recentReservations.map((r) => (
                        <tr
                          key={r.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {r.guestName || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {r.hostName || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {r.listingName || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {r.createdAt
                              ? r.createdAt.toDate().toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(
                                r.status
                              )}`}
                            >
                              {r.status || "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-6 py-12 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No recent reservations</p>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Least Booked */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 shadow-sm border border-orange-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-200 to-red-200 opacity-20 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                      <TrendingDown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Least Booked
                      </h3>
                      <p className="text-sm text-gray-600">Needs attention</p>
                    </div>
                  </div>
                  {lowestRatedListing ? (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-orange-200/50">
                      <p className="font-semibold text-gray-900 mb-2">
                        {lowestRatedListing.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {lowestRatedListing.bookings} bookings
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600">No data available</p>
                  )}
                </div>
              </div>

              {/* Most Booked */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 shadow-sm border border-emerald-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-200 to-teal-200 opacity-20 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Most Booked
                      </h3>
                      <p className="text-sm text-gray-600">Top performer</p>
                    </div>
                  </div>
                  {highestRatedListing ? (
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/50">
                      <p className="font-semibold text-gray-900 mb-2">
                        {highestRatedListing.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {highestRatedListing.bookings} bookings
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600">No data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "reservations":
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    All Reservations
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage and track all platform bookings
                  </p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reservations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full md:w-80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Summary of reservation statuses */}
              <div className="mt-4 flex flex-wrap gap-4">
                {["Confirmed", "Completed", "Cancelled"].map((status) => {
                  const count = filteredReservations.filter(
                    (r) => r.status?.toLowerCase() === status.toLowerCase()
                  ).length;
                  // Determine background and text color based on status
                  let bgColor = "bg-gray-100";
                  let textColor = "text-gray-700";

                  if (status === "Confirmed") {
                    bgColor = "bg-emerald-100";
                    textColor = "text-emerald-700";
                  } else if (status === "Completed") {
                    bgColor = "bg-blue-100";
                    textColor = "text-blue-700";
                  } else if (status === "Cancelled") {
                    bgColor = "bg-red-100";
                    textColor = "text-red-700";
                  }

                  return (
                    <div
                      key={status}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${bgColor} ${textColor}`}
                    >
                      {status}: {count}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scrollable table container */}
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Guest
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Host
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Listing
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReservations.length > 0 ? (
                    filteredReservations.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {r.guestName || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {r.hostName || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {r.listingName || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {r.createdAt
                            ? r.createdAt.toDate().toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(
                              r.status
                            )}`}
                          >
                            {r.status || "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500 font-medium">
                          No reservations found
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          Try adjusting your search
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "reviews":
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-olive to-olive-darker p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Top Rated Listings
                </h2>
                <p className="text-sm text-gray-500">
                  Ranked by kubohub guests' satisfaction
                </p>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div className="text-center py-16">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No rating data available.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((item, index) => (
                  <div
                    key={item.listingId}
                    className={`${getRankBadgeColor(
                      index
                    )} border rounded-xl p-4 transition-all hover:shadow-md hover:scale-[1.01]`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank Icon */}
                      <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
                        {getRankIcon(index)}
                      </div>

                      {/* Listing Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base truncate">
                          {item.title}
                        </h3>

                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          {/* Rating */}
                          <div className="flex items-center gap-1.5">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold text-gray-900">
                              {item.avgRating.toFixed(2)}
                            </span>
                            <span className="text-gray-500 text-sm">/ 5</span>
                          </div>

                          {/* Reviews */}
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">
                              {item.reviewCount} reviews
                            </span>
                          </div>

                          {/* Bookings */}
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm">
                              {item.bookingCount} bookings
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        case "rewards": 
        return(
          <>
          <RewardsAdminPanel/>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header + Tabs */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg flex items-center justify-center">
              <img
                src={logo}
                alt="Logo"
                className="w-full h-full object-cover"
              />
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
                <p className="text-sm font-semibold">
                  {adminData?.name || "Admin User"}
                </p>
                <p className="text-xs text-gray-500">
                  {adminData?.email || "admin@platform.com"}
                </p>
              </div>
              <img
                src={adminData.profilePic}
                alt="icon"
                className="w-10 h-10 rounded-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="px-6 flex gap-1 overflow-x-auto">
          {["dashboard", "reservations", "reviews", "rewards"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
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
