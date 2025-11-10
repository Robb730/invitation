// src/utils/notificationSystem.js
import {
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// 🟢 When host requests a cashout
export const cashoutRequest = async (hostId, amount, paypalEmail) => {
  try {
    const cashoutsRef = collection(db, "cashouts");

    await addDoc(cashoutsRef, {
      hostId: hostId,
      amount: amount,
      paypalEmail: paypalEmail,
      status: "Pending",
      createdAt: new Date(), // ✅ add timestamp
    });

    console.log("✅ Cashout requested successfully");
  } catch (error) {
    console.error("❌ Error adding cashout request:", error);
  }
};

// 🟡 When admin approves or declines a cashout
export const cashoutApprovedOrDeclined = async (hostId, newStatus) => {
  try {
    const cashoutsRef = collection(db, "cashouts");

    // 🔍 Find the document(s) where hostId matches
    const q = query(cashoutsRef, where("hostId", "==", hostId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("⚠️ No cashout found for this hostId");
      return;
    }

    // ✅ Update all matching documents
    querySnapshot.forEach(async (docSnap) => {
      const docRef = docSnap.ref;

      if (newStatus === "Approved") {
        await updateDoc(docRef, {
          status: "Approved",
          updatedAt: new Date(), // ✅ add timestamp for approval/decline
        });

        console.log(`✅ Cashout approved for hostId: ${hostId}`);
      } else if (newStatus === "Declined") {
        await updateDoc(docRef, {
          status: "Declined",
          updatedAt: new Date(),
        });
        console.log(`❌ Cashout declined for hostId: ${hostId}`);
      } else {
        console.warn(`⚠️ Invalid status: ${newStatus}`);
      }
    });
  } catch (error) {
    console.error("❌ Error updating cashout status:", error);
  }
};
