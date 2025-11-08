// src/utils/notificationSystem.js
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {db} from "../firebaseConfig"


export const addNotification = async (type, listingId, listingTitle, guestId, hostId, points) => {
  try {
    const notificationsRef = collection(db, "notifications");

    await addDoc(notificationsRef, {
      type,
      listingId,
      listingTitle,
      hostId,
      guestId,
      points,
      createdAt: serverTimestamp(),
      isRead: false, // new notifications are unread
    });

    console.log("✅ Notification added successfully");
  } catch (error) {
    console.error("❌ Error adding notification:", error);
  }
};
