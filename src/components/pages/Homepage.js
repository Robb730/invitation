import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import Navbar from "./homepage-comp/Navbar";
import Search from "./homepage-comp/Search";
import Pagination from "./homepage-comp/Pagination";
import Footer from "./homepage-comp/Footer";
import { useNavigate } from "react-router-dom";

const Homepage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  

  // simulate clicking a listing
  const handleListingClick = (listingId) => {
    if (!auth.currentUser) {
      alert("You need to sign in to view details.");
      navigate("/login");
    } else {
      //navigate(`/listing/${listingId}`);
      alert(`Navigating to listing ${listingId}` + listingId.title);
    }
  };

  return (
    <div className="bg-beige min-h-screen">
      <Navbar user={user}/>
      <Search user= {user}/>
      <Pagination onListingClick={handleListingClick} />
      <Footer/>
    </div>
  );
};

export default Homepage;
