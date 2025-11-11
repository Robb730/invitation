import { doc, getDoc, updateDoc } from "firebase/firestore";
import {db} from "../firebaseConfig"

export const updateHostTier = async (hostId) => {
  const pointsRef = doc(db, "hostPoints", hostId);
  const snap = await getDoc(pointsRef);

  if (!snap.exists()) {
    console.log("host not found");
    return;
  }

  const hostPointsData = snap.data();
  console.log(hostPointsData.points);
  const points = hostPointsData.points;

  if (points < 200) {
    await updateDoc(pointsRef, {
      tier: "Bronze",
    });
  } else if(points >= 200 && points < 500 ) {
    await updateDoc(pointsRef, {
      tier: "Silver",
    });
  } else if(points >= 500 && points < 1000 ) {
    await updateDoc(pointsRef, {
      tier: "Gold",
    });
  } else if(points >= 1000 && points < 2000 ) {
    await updateDoc(pointsRef, {
      tier: "Diamoind",
    });
  } else if(points >= 4000) {
    await updateDoc(pointsRef, {
      tier: "Hiraya Host",
    });
  }
};
