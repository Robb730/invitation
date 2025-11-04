import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import Navbar from "./homepage-comp/Navbar";
import Search from "./homepage-comp/Search";
import Pagination from "./homepage-comp/Pagination";
import Footer from "./homepage-comp/Footer";
import { useNavigate } from "react-router-dom";
import { FaRegComment } from "react-icons/fa"; // Message bubble icon
import { useLocation } from "react-router-dom";

const Homepage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useState({
    location: "",
    date: "",
    guests: "",
  });

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

  const location = useLocation();

useEffect(() => {
  if (location.state?.scrollTo) {
    const section = document.getElementById(location.state.scrollTo);
    if (section) {
      setTimeout(() => {
        section.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  }
}, [location]);


  return (
    <div className="bg-beige min-h-screen">
      <Navbar user={user} />
      <Search user={user} onSearch={(params) => setSearchParams(params)} />
      <Pagination onListingClick={handleListingClick} user={user} searchParams={searchParams}/>
      <Footer />

      {/* Floating Message Icon */}
      { user && (<div
        onClick={handleMessageClick}
        className="fixed bottom-10 right-5 bg-olive-dark text-white p-4 rounded-full shadow-lg cursor-pointer hover:opacity-90 transition"
      >
        <FaRegComment size={30} />
      </div>)}
    </div>
  );
};

export default Homepage;
