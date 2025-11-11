import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { updateHostTier } from "./updateHostTier";

// 🪙 Adjust host points
export const updateHostPoints = async (hostId, delta) => {
  const pointsRef = doc(db, "hostPoints", hostId);
  const snap = await getDoc(pointsRef);

  if (!snap.exists()) {
    // Create new points doc if none exists yet
    await setDoc(pointsRef, {
      hostId,
      points: Math.max(delta, 0), // Prevent negatives on first write
      tier: "Bronze",
      lastUpdated: new Date(),
    });
  } else {
    await updateDoc(pointsRef, {
      points: increment(delta),
      lastUpdated: new Date(),
    });
    updateHostTier(hostId);
  }
};

// 🧮 Get tier based on total points
export const getTierFromPoints = (points) => {
  if (points < 200) return "Bronze";
  if (points < 500) return "Silver";
  if (points < 1000) return "Gold";
  if (points < 2000) return "Platinum";
  if (points < 4000) return "Diamond";
  return "Hiraya Host";
};
