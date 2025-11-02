import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import Navbar from "./homepage-comp/Navbar";
import Search from "./homepage-comp/Search";
import Pagination from "./homepage-comp/Pagination";
import Footer from "./homepage-comp/Footer";
import { useNavigate } from "react-router-dom";
import { FaRegComment } from "react-icons/fa"; // Message bubble icon

const Homepage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && user.role === "host") {
      navigate("/hostpage");
    }
  }, [navigate, user]);

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

  // Navigate to messages route
  const handleMessageClick = () => {
    if (!user) {
      alert("You need to sign in to view messages.");
      navigate("/login");
    } else {
      navigate("/messages");
    }
  };

  return (
    <div className="bg-beige min-h-screen">
      <Navbar user={user} />
      <Search user={user} />
      <Pagination onListingClick={handleListingClick} user={user} />
      <Footer />

      {/* Floating Message Icon */}
      <div
        onClick={handleMessageClick}
        className="fixed bottom-10 right-5 bg-olive-dark text-white p-4 rounded-full shadow-lg cursor-pointer hover:opacity-90 transition"
      >
        <FaRegComment size={30} />
      </div>
    </div>
  );
};

export default Homepage;
