// src/utils/notificationSystem.js
import { collection, addDoc, updateDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

// 🟢 When host requests a cashout
export const cashoutRequest = async (hostId, amount, paypalEmail) => {
  try {
    const cashoutsRef = collection(db, "cashouts");

    await addDoc(cashoutsRef, {
      hostId,
      amount,
      paypalEmail,
      status: "Pending",
      createdAt: new Date(), // ✅ timestamp when requested
    });

    console.log("✅ Cashout requested successfully");
  } catch (error) {
    console.error("❌ Error adding cashout request:", error);
  }
};

// 🟡 When admin approves or declines a specific cashout (by document ID)
export const cashoutApprovedOrDeclined = async (cashoutId, newStatus) => {
  try {
    const cashoutRef = doc(db, "cashouts", cashoutId); // 🔍 Directly reference the document

     const cashoutSnap = await getDoc(cashoutRef);

    if (!cashoutSnap.exists()) {
      console.log("⚠️ Cashout not found");
      return;
    }

    const cashoutData = cashoutSnap.data();
    console.log("📄 Cashout data fetched:", cashoutData);
    
    const amount = cashoutData.amount;

    const hostRef = doc(db, "users", cashoutData.hostId)
    const hostSnap = await getDoc(hostRef);

    if(!hostSnap.exists()){
        console.log("'no host found");
        return;
    }

    const hostData = hostSnap.data();

    const walletBalance = hostData.ewallet;

    if (newStatus === "Approved") {
      await updateDoc(cashoutRef, {
        status: "Approved",
        updatedAt: new Date(), // ✅ add timestamp
      });

      try {
        const response = await fetch(
          "https://custom-email-backend.onrender.com/api/payout",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              hostId: cashoutData.hostId,
              amount: cashoutData.amount,
              paypalEmail: cashoutData.paypalEmail,
            }),
          }
        );

        const data = await response.json();

        if (data.success) {
          alert("✅ Withdrawal successful! Funds sent to your PayPal account.");
          await updateDoc(doc(db, "users", cashoutData.hostId), {
            ewallet: walletBalance - amount,
          });
          
        } else {
          alert("❌ Withdrawal failed: " + data.message);
        }
      } catch (error) {
        console.error("Cash out error:", error);
        alert("Something went wrong.");
      }
      console.log(`✅ Cashout approved (ID: ${cashoutId})`);

    } else if (newStatus === "Declined") {
      await updateDoc(cashoutRef, {
        status: "Declined",
        updatedAt: new Date(),
      });
      console.log(`❌ Cashout declined (ID: ${cashoutId})`);
    } else {
      console.warn(`⚠️ Invalid status: ${newStatus}`);
    }
  } catch (error) {
    console.error("❌ Error updating cashout status:", error);
  }
};
