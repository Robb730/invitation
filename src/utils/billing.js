// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.markUnpaidHosts = functions.pubsub
  .schedule("every day 00:00") // runs daily at midnight
  .timeZone("Asia/Manila") // adjust to your timezone
  .onRun(async (context) => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const yy = String(today.getFullYear()).slice(-2);

    const todayStr = `${mm}${dd}${yy}`;

    const usersRef = admin.firestore().collection("users");
    const snapshot = await usersRef.where("nextbilling", "==", todayStr).get();

    const batch = admin.firestore().batch();
    snapshot.forEach((docSnap) => {
      batch.update(docSnap.ref, { paid: false });
    });

    await batch.commit();
    console.log(`Marked ${snapshot.size} hosts as unpaid for ${todayStr}`);
    return null;
  });
