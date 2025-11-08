import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
  deleteDoc, // ✅ import deleteDoc
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { getAuth } from "firebase/auth";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [guestData, setGuestData] = useState({});
  const auth = getAuth();
  const hostId = auth.currentUser?.uid;

  // 🔹 Listen for notifications for this host
  useEffect(() => {
    if (!hostId) return;

    const q = query(
      collection(db, "notifications"),
      where("hostId", "==", hostId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 🔹 Sort by createdAt (most recent first)
      const sorted = fetched.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setNotifications(sorted);
    });

    return () => unsubscribe();
  }, [hostId]);

  // 🔹 Fetch guest data
  useEffect(() => {
    const fetchGuestData = async () => {
      const updatedGuestData = { ...guestData };

      for (const notif of notifications) {
        const guestId = notif.guestId;
        if (guestId && !updatedGuestData[guestId]) {
          try {
            const guestRef = doc(db, "users", guestId);
            const guestSnap = await getDoc(guestRef);
            if (guestSnap.exists()) {
              updatedGuestData[guestId] = guestSnap.data();
            } else {
              updatedGuestData[guestId] = null;
            }
          } catch (err) {
            console.error("Error fetching guest data:", err);
          }
        }
      }

      setGuestData(updatedGuestData);
    };

    if (notifications.length > 0) fetchGuestData();
  }, [notifications, guestData]);

  // 🔹 Mark all as read when viewed
  useEffect(() => {
    const markAsRead = async () => {
      const unread = notifications.filter((n) => !n.isRead);
      unread.forEach(async (n) => {
        const docRef = doc(db, "notifications", n.id);
        await updateDoc(docRef, { isRead: true });
      });
    };

    if (notifications.length > 0) markAsRead();
  }, [notifications]);

  // 🔹 Delete notification handler
  const handleDeleteNotification = async (id) => {
    try {
      await deleteDoc(doc(db, "notifications", id));
      // 🔹 Optimistic UI update: remove immediately
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      console.log("✅ Notification deleted");
    } catch (error) {
      console.error("❌ Error deleting notification:", error);
    }
  };

  // 🔹 Helper function to format time
  const formatDateTime = (timestamp) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60)
      return diffMins <= 1 ? "Just now" : `${diffMins} mins ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // 🔹 Notification icon selector
  const getNotificationIcon = (type) => {
    switch (type) {
      case "Reservation":
        return "🎉";
      case "Cancellation Request":
        return "⚠️";
      case "Cancelled":
        return "❌";
      default:
        return "📬";
    }
  };

  // 🔹 Render notifications
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            Stay updated with your reservations and requests
          </p>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">No notifications yet</p>
            <p className="text-gray-400 text-sm mt-2">
              We'll notify you when something important happens
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const guest = guestData[n.guestId];
              const guestName = guest?.name || guest?.fullName || "A guest";

              return (
                <div
                  key={n.id}
                  className={`relative bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${
                    !n.isRead ? "ring-2 ring-blue-400" : ""
                  }`}
                >
                  {/* ❌ Delete Button */}
                  <button
                    onClick={() => handleDeleteNotification(n.id)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition"
                    title="Delete notification"
                  >
                    ✕
                  </button>

                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`text-3xl flex-shrink-0 ${
                          !n.isRead ? "animate-pulse" : ""
                        }`}
                      >
                        {getNotificationIcon(n.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Type Badge */}
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                            n.type === "Reservation"
                              ? "bg-green-100 text-green-700"
                              : n.type === "Cancellation Request"
                              ? "bg-yellow-100 text-yellow-700"
                              : n.type === "Cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {n.type}
                        </span>

                        {n.points !== 0 && (
                      <span className={`inline-flex items-center ml-3 gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        n.type === "Reservation"
                          ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm"
                          : "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm"
                      }`}>
                        <span className="text-sm">★</span>
                        {n.points > 0 ? '+' : ''}{n.points}
                      </span>
                    )}

                        {/* Message */}
                        <p className="text-gray-900 leading-relaxed mb-2">
                          {n.type === "Reservation" ? (
                            <>
                              Your listing{" "}
                              <span className="font-semibold">
                                "{n.listingTitle}"
                              </span>{" "}
                              was booked by{" "}
                              <span className="font-semibold">{guestName}</span>
                              !
                            </>
                          ) : n.type === "Cancellation Request" ? (
                            <>
                              <span className="font-semibold">{guestName}</span>{" "}
                              requested a cancellation for{" "}
                              <span className="font-semibold">
                                "{n.listingTitle}"
                              </span>
                              .
                            </>
                          ) : n.type === "Cancelled" ? (
                            <>
                              The reservation made by{" "}
                              <span className="font-semibold">{guestName}</span>{" "}
                              on your listing{" "}
                              <span className="font-semibold">
                                "{n.listingTitle}"
                              </span>{" "}
                              has been cancelled.
                            </>
                          ) : (
                            <>
                              Notification for{" "}
                              <span className="font-semibold">
                                "{n.listingTitle}"
                              </span>
                              .
                            </>
                          )}
                        </p>

                       

                        {/* Timestamp */}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
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
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {formatDateTime(n.createdAt)}
                        </div>
                      </div>

                      {/* Unread Indicator */}
                      {!n.isRead && (
                        <div className="flex-shrink-0">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
