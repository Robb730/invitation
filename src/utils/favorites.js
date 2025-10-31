import { db } from "../firebaseConfig";
import { deleteDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const getUserId = () => {
  const auth = getAuth();
  return auth.currentUser ? auth.currentUser.uid : null;
};

export const isFavorite = async (listingId) => {
  const userId = getUserId();
  if (!userId) return false;

  const q = query(
    collection(db, "favorites"),
    where("userId", "==", userId),
    where("listingId", "==", listingId)
  );
  const snap = await getDocs(q);
  return !snap.empty;
};

export const toggleFavorite = async (listingId) => {
  const userId = getUserId();
  if (!userId) {
    alert("Please log in to add favorites.");
    return false;
  }

  const q = query(
    collection(db, "favorites"),
    where("userId", "==", userId),
    where("listingId", "==", listingId)
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    // Already a favorite → remove it
    await deleteDoc(snap.docs[0].ref);
    return false;
  } else {
    // Not yet favorited → add new document
    await addDoc(collection(db, "favorites"), {
      userId,
      listingId,
      createdAt: new Date(),
    });
    return true;
  }
};
