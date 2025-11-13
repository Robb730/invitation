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
import PaymentCashoutsPanel from "./admin-comp/PaymentCashoutsPanel";
import ServiceFeePanel from "./admin-comp/ServiceFeeAndPolicyPanel";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import WishlistsView from "./admin-comp/WishlistsView";

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

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [statusFilter, setStatusFilter] = useState("All");
  



  const navigate = useNavigate();

  // 🔹 Load admin data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/"); // redirect if not logged in
        return;
      }

      try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = { id: docSnap.id, ...docSnap.data() };
          setAdminData(userData);

          if (userData.role?.toLowerCase() === "guest") {
            navigate("/"); // redirect to home or login
            return;
          } else if (userData.role?.toLowerCase() === "host") {
            navigate("/hostpage");
            return;
          }
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
  }, [auth, navigate]);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".profile-dropdown")) {
        setShowLogoutModal(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Filter reservations in real-time
  const filteredReservations = allReservations.filter((r) => {
    const matchesSearch =
      r.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.hostName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.listingName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      r.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
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

  // 🖨️ Generate Printable Report
  const handlePrintReport = () => {
    const confirmedCount = filteredReservations.filter(
      (r) => r.status?.toLowerCase() === "confirmed"
    ).length;
    const completedCount = filteredReservations.filter(
      (r) => r.status?.toLowerCase() === "completed"
    ).length;
    const cancelledCount = filteredReservations.filter(
      (r) => r.status?.toLowerCase() === "cancelled"
    ).length;

    const printWindow = window.open("", "_blank", "width=900,height=700");

    const reportHTML = `
  <html>
    <head>
      <title>KuboHub | Reservations Report</title>
      <style>
  body {
    font-family: 'Segoe UI', sans-serif;
    margin: 40px;
    background: #f8f9f6;
    color: #2f2f2f;
    line-height: 1.5;
  }

  header {
    text-align: center;
    margin-bottom: 30px;
  }

  header img {
    height: 70px;
    margin-bottom: 8px;
  }

  h1 {
    font-size: 30px;
    margin: 0;
    color: #3d4f3a;
  }

  h2 {
    font-size: 16px;
    font-weight: 500;
    margin-top: 4px;
    color: #666;
  }

  .summary {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin: 25px 0;
    flex-wrap: wrap;
  }

  .summary-box {
    background: linear-gradient(135deg, #ffffff, #f0f0f0);
    border-radius: 12px;
    padding: 15px 25px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.08);
    text-align: center;
    min-width: 140px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .summary-box:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.12);
  }

  .summary-box h3 {
    margin: 0;
    font-size: 16px;
    color: #3d4f3a;
  }

  .summary-box p {
    margin: 6px 0 0;
    font-size: 20px;
    font-weight: bold;
  }

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin-top: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    border-radius: 10px;
    overflow: hidden;
  }

  th, td {
    padding: 12px 16px;
    font-size: 13px;
    border: 1px
  }

  th {
    background: #e8eddf;
    color: #3d4f3a;
    text-align: left;
    font-weight: 600;
  }

  tr:nth-child(even) {
    background-color: #f9f9f9;
  }

  tr:hover {
    background-color: #f1f7ed;
  }

  .status {
    font-weight: 600;
    padding: 5px 14px;
    border-radius: 9999px;
    display: inline-block;
    font-size: 0.875rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .confirmed { background: #d1fae5; color: #065f46; }
  .completed { background: #bfdbfe; color: #1e3a8a; }
  .cancelled { background: #fee2e2; color: #991b1b; }

  footer {
    margin-top: 40px;
    font-size: 12px;
    text-align: center;
    color: #777;
    border-top: 1px solid #ddd;
    padding-top: 10px;
  }
    
</style>

    </head>
    <body>
      <header>
        <img src="${logo}" alt="KuboHub Logo" />
        <h1>KuboHub Reservation Report</h1>
        <h2>${new Date().toLocaleDateString()}</h2>
      </header>

      <section class="summary">
        <div class="summary-box confirmed">
          <h3>Confirmed</h3>
          <p>${confirmedCount}</p>
        </div>
        <div class="summary-box completed">
          <h3>Completed</h3>
          <p>${completedCount}</p>
        </div>
        <div class="summary-box cancelled">
          <h3>Cancelled</h3>
          <p>${cancelledCount}</p>
        </div>
      </section>

      <table>
        <thead>
  <tr>
    <th>#</th> <!-- Number column -->
    <th>Guest</th>
    <th>Host</th>
    <th>Listing</th>
    <th>Date</th>
    <th>Status</th>
  </tr>
</thead>

        <tbody>
  ${filteredReservations
    .map(
      (r, index) => ` 
      <tr>
        <td>${index + 1}</td> <!-- Auto-numbering -->
        <td>${r.guestName || "—"}</td>
        <td>${r.hostName || "—"}</td>
        <td>${r.listingName || "—"}</td>
        <td>${
          r.createdAt ? r.createdAt.toDate().toLocaleDateString() : "—"
        }</td>
        <td><span class="status ${r.status?.toLowerCase() || ""}">${
        r.status || "Pending"
      }</span></td>
      </tr>
    `
    )
    .join("")}
</tbody>

      </table>

      <footer>
        Generated by <strong>KuboHub Admin</strong> • ${new Date().toLocaleString()}
      </footer>
    </body>
  </html>
  `;

    printWindow.document.open();
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.print();
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

          const bookingCount = bookingMap[listingId] || 0;
          const reviewCount = ratingsArr.length;

          // Weighted score calculation
          const score =
            avgRating * 5 + // rating weight
            bookingCount * 1 + // booking weight
            reviewCount * 2; // review count weight

          return {
            listingId,
            title: listing.title || "Untitled",
            avgRating,
            reviewCount,
            bookingCount,
            score, // store the computed score
          };
        });

        // Sort by the combined score
        leaderboardData.sort((a, b) => b.score - a.score);

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
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gradient-to-r from-olive to-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                      Recent Reservations
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Latest booking activity on the platform
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("reservations")}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-olive-dark hover:bg-olive-dark hover:text-white rounded-lg transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">View All</span>
                    <span className="sm:hidden">All</span>
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>

              {recentReservations.length > 0 ? (
                <>
                  {/* Desktop Table View - Hidden on Mobile */}
                  <div className="hidden md:block overflow-x-auto">
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
                  </div>

                  {/* Mobile Card View - Hidden on Desktop */}
                  <div className="md:hidden divide-y divide-gray-200">
                    {recentReservations.map((r) => (
                      <div key={r.id} className="overflow-hidden">
                        {/* Card Header with Listing Name and Status */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {r.listingName || "—"}
                            </h3>
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap shadow-sm ${getStatusStyles(
                              r.status
                            )}`}
                          >
                            {r.status || "Pending"}
                          </span>
                        </div>

                        {/* Card Body with Details */}
                        <div className="bg-white px-4 py-3 space-y-2.5">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Guest
                            </span>
                            <span className="text-sm font-medium text-gray-900 truncate text-right flex-1">
                              {r.guestName || "—"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Host
                            </span>
                            <span className="text-sm text-gray-700 truncate text-right flex-1">
                              {r.hostName || "—"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-100">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Date
                            </span>
                            <span className="text-sm text-gray-600 whitespace-nowrap">
                              {r.createdAt
                                ? r.createdAt.toDate().toLocaleDateString()
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="px-4 sm:px-6 py-8 sm:py-12 text-center text-gray-500">
                  <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
                  <p className="font-medium text-sm sm:text-base">
                    No recent reservations
                  </p>
                </div>
              )}
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
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header Section */}
            <div className="px-4 sm:px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
              <div className="flex flex-col gap-4">
                {/* Title */}
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                    📋 All Reservations
                  </h2>
                  <p className="text-sm text-gray-600">
                    Manage and track all platform bookings
                  </p>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {["Confirmed", "Completed", "Cancelled"].map((status) => {
                    const count = filteredReservations.filter(
                      (r) => r.status?.toLowerCase() === status.toLowerCase()
                    ).length;
                    
                    
                    
                    const colors = {
                      Confirmed: "from-emerald-400 to-emerald-500",
                      Completed: "from-blue-400 to-blue-500",
                      Cancelled: "from-red-400 to-red-500"
                    };

                    return (
                      <div
                        key={status}
                        className={`bg-gradient-to-br ${colors[status]} rounded-xl p-3 sm:p-4 text-white shadow-md transform hover:scale-105 transition-transform`}
                      >
                        <div className="text-lg sm:text-2xl font-bold mb-1">{count}</div>
                        <div className="text-xs sm:text-sm opacity-90 flex items-center gap-1">
                          
                          <span className="hidden sm:inline">{status}</span>
                          <span className="sm:hidden">{status.slice(0, 4)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="🔍 Search by guest, host, or listing..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-3 w-full border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
                  />
                </div>

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                  {["All", "Confirmed", "Completed", "Cancelled"].map(
                    (filter) => (
                      <button
                        key={filter}
                        onClick={() => setStatusFilter(filter)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                          statusFilter === filter
                            ? "bg-gradient-to-r from-olive to-olive-darker text-white shadow-lg"
                            : "bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200"
                        }`}
                      >
                        {filter}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => handlePrintReport()}
                    className="ml-auto px-4 py-2 bg-gradient-to-r from-olive to-olive-dark text-white rounded-full hover:from-olive-dark hover:to-olive-darker transition-all text-sm font-medium shadow-lg transform hover:scale-105"
                  >
                    🖨️ <span className="hidden sm:inline">Print Report</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 z-10">
                  <tr className="border-b-2 border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      👤 Guest
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      🏠 Host
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      📍 Listing
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      📅 Date
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredReservations.length > 0 ? (
                    filteredReservations.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {r.guestName || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {r.hostName || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {r.listingName || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {r.createdAt
                            ? r.createdAt.toDate().toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${getStatusStyles(
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
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-10 h-10 text-gray-400" />
                          </div>
                          <p className="text-gray-600 font-semibold text-lg">
                            No reservations found
                          </p>
                          <p className="text-gray-400 text-sm mt-2">
                            Try adjusting your search or filter
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden max-h-[500px] overflow-y-auto p-4 space-y-3">
              {filteredReservations.length > 0 ? (
                filteredReservations.map((r) => (
                  <div
                    key={r.id}
                    className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border-2 border-gray-200 shadow-md hover:shadow-lg transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">👤 Guest</div>
                        <div className="font-bold text-gray-900 text-base">
                          {r.guestName || "—"}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getStatusStyles(
                          r.status
                        )}`}
                      >
                        {r.status || "Pending"}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-medium">🏠 Host:</span>
                        <span className="text-gray-700">{r.hostName || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-medium">📍 Listing:</span>
                        <span className="text-gray-900 font-medium">{r.listingName || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-medium">📅 Date:</span>
                        <span className="text-gray-600">
                          {r.createdAt
                            ? r.createdAt.toDate().toLocaleDateString()
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-semibold text-lg">
                    No reservations found
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Try adjusting your search or filter
                  </p>
                </div>
              )}
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
        return (
          <>
            <RewardsAdminPanel />
          </>
        );
      case "service fee & policy":
        return (
          <>
            <ServiceFeePanel />
          </>
        );
      case "payment cashouts":
        return (
          <>
            <PaymentCashoutsPanel  />
          </>
        );
      case "wishlists":
        return (
          <>
            <WishlistsView />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* ✅ Header + Tabs */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        {/* ✅ Top Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3 sm:gap-0">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-md flex items-center justify-center shrink-0">
              <img
                src={logo}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-olive to-olive-darker bg-clip-text text-transparent leading-tight">
                KuboHub <span className="font-thin">Admin</span>
              </h1>
              <p className="text-[11px] sm:text-xs text-gray-500">
                Manage your platform
              </p>
            </div>
          </div>

          {/* ✅ Admin Info */}
          <div className="flex items-center gap-3 pl-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-gray-200 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0">
            <div className="text-left sm:text-right">
              <p className="text-sm sm:text-base font-semibold truncate max-w-[120px] sm:max-w-[180px]">
                {adminData?.name || "Admin User"}
              </p>
              <p className="text-xs text-gray-500 truncate max-w-[160px] sm:max-w-[200px]">
                {adminData?.email || "admin@platform.com"}
              </p>
            </div>
            <div className="relative profile-dropdown">
              {/* Profile Picture */}
              <img
                src={adminData?.profilePic}
                alt="Admin"
                onClick={() => setShowLogoutModal((prev) => !prev)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover cursor-pointer border border-gray-200 hover:ring-2 hover:ring-olive transition-all"
              />

              {/* Dropdown Modal */}
              {showLogoutModal && (
                <div
                  className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50"
                  onMouseLeave={() => setShowLogoutModal(false)}
                >
                  <button
                    onClick={async () => {
                      try {
                        await signOut(auth);
                        window.location.href = "/"; // redirect to login or home
                      } catch (error) {
                        console.error("Logout error:", error);
                      }
                    }}
                    className="w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 text-left font-medium transition-all"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ✅ Tabs Navigation */}
        <div className="px-2 sm:px-6 flex gap-1 overflow-x-auto scrollbar-hide">
          {[
            "dashboard",
            "reservations",
            "reviews",
            "rewards",
            "service fee & policy",
            "payment cashouts",
            "wishlists",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 sm:px-6 py-2 sm:py-3 font-medium text-xs sm:text-sm transition-all whitespace-nowrap rounded-t-lg ${
                activeTab === tab
                  ? "text-olive-dark border-b-2 border-olive-dark bg-green-50/50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              
            </button>
          ))}
        </div>
      </header>

      {/* ✅ Main Content */}
      <main className="p-4 sm:p-6 max-w-7xl mx-auto">{renderTabContent()}</main>
    </div>
  );
};

export default AdminPage;
