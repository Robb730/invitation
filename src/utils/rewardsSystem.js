import { db } from "../firebaseConfig";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";

// Generate secure 6-character code
export function generateRewardCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
}

// Admin creates reward
export async function addReward({ tier, title, pointsRequired, type, discountPercent, ewalletAmount }) {
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

  await updateDoc(doc(db, "rewards", rewardId), {
    codes: arrayUnion({
      hostId,
      code,
      active: true,
      claimedAt: Date.now(),
    }),
  });

  return code;
}
