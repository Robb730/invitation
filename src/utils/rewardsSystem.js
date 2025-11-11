import { db } from "../firebaseConfig";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import axios from "axios"
// Generate secure 6-character code
export function generateRewardCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
}

// Admin creates reward
export async function addReward({
  tier,
  title,
  pointsRequired,
  type,
  discountPercent,
  ewalletAmount,
}) {
  const rewardData = {
    tier,
    title,
    pointsRequired,
    type,
    createdAt: serverTimestamp(),
    codes: [],
    active: true,
  };

  // Add extra fields depending on reward type
  if (type === "host-payment" || type === "reservation-discount") {
    rewardData.discount = discountPercent || 0; // store discount percentage
  } else if (type === "ewallet-credit") {
    rewardData.money = ewalletAmount || 0; // store money amount
  }

  console.log("Reward Data being added:", rewardData);

  return await addDoc(collection(db, "rewards"), rewardData);
}

// Host claims reward → generate unique claim code
export async function claimReward(rewardId, hostId) {
  const code = generateRewardCode();

  // ✅ Fetch the reward document
  const rewardRef = doc(db, "rewards", rewardId);
  const rewardSnap = await getDoc(rewardRef);

  if (!rewardSnap.exists()) {
    throw new Error("Reward not found");
  }

  // ✅ Extract only the title
  const rewardData = rewardSnap.data();

  console.log("Reward Title:", rewardData.title);
  let rewardType = "";
  let rewardAmount = "";

  if(rewardData.type === "ewallet-credit") {
    rewardType = "E-Wallet Credit";
    rewardAmount = "₱"+rewardData.money;
  } else if (rewardData.type === "reservation-discount") {
    rewardType = "Reservation Discount";
    rewardAmount = rewardData.discount + "% off";
  } else if (rewardData.type === "host-payment") {
    rewardType = "Subscription Discount";
    rewardAmount = rewardData.discount + " off";
  } else {
    rewardType = "dont know";
  }
  console.log("reward type: "+rewardType+"\nreward amount: "+ rewardAmount );

  const hostRef = doc(db, "users", hostId);
  const hostSnap = await getDoc(hostRef);

  if(!hostSnap.exists()) {
    console.log("host not found");
  }

  const hostData = hostSnap.data();

  // ✅ Continue your logic...
  await updateDoc(rewardRef, {
    codes: arrayUnion({
      hostId,
      code,
      active: true,
      claimedAt: Date.now(),
    }),
  });

  console.log("email: "+hostData.email);

  // send email of code
  await axios.post(
    "https://custom-email-backend.onrender.com/send-reward-code",
    {
      hostEmail: hostData.email,
      hostName: hostData.fullName,
      code: code,
      rewardTitle: rewardData.title,
      rewardType: rewardType,
      rewardAmount: rewardAmount,
    },
    { headers: { "Content-Type": "application/json" } }
  );

  return code;
}
