import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(undefined); // undefined = still checking

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    // while Firebase checks session
    return <p>Loading...</p>;
  }

  if (!user) {
    // if no user logged in
    return <Navigate to="/" replace />;
  }

  // if logged in
  return children;
};

export default ProtectedRoute;
