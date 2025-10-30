import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [userData, setUserData] = useState({ user: null, role: null, loading: true });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserData({ user: currentUser, role: userSnap.data().role, loading: false });
        } else {
          setUserData({ user: currentUser, role: null, loading: false });
        }
      } else {
        setUserData({ user: null, role: null, loading: false });
      }
    });

    return () => unsubscribe();
  }, []);

  if (userData.loading) return <p>Loading...</p>;

  if (!userData.user) {
    return <Navigate to="/login" replace />;
  }

  // check if role is allowed
  if (allowedRoles && !allowedRoles.includes(userData.role)) {
    // redirect based on their role
    if (userData.role === "host") return <Navigate to="/hostpage" replace />;
    if (userData.role === "guest") return <Navigate to="/" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
