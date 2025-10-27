import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Navbar from "./homepage-comp/Navbar";
import Footer from "./homepage-comp/Footer";

const ListingDetails = () => {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [hostName, setHostName] = useState("Unknown Host");
  const [hostPic, setHostPic] = useState("pic");

  // 🔹 Fetch the listing data
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const docRef = doc(db, "listings", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setListing(docSnap.data());
        } else {
          console.log("Listing not found");
        }
      } catch (err) {
        console.error("Error fetching listing:", err);
      }
    };
    fetchListing();
  }, [id]);

  // 🔹 Once listing is loaded, fetch host info using hostId
  useEffect(() => {
    const fetchHostInfo = async () => {
      if (!listing?.hostId) return; // Wait until listing is loaded
      try {
        const hostRef = doc(db, "users", listing.hostId);
        const hostSnap = await getDoc(hostRef);
        if (hostSnap.exists()) {
          const data = hostSnap.data();
          setHostName(data.fullName || data.name || "Unknown Host");
          setHostPic(data.profilePic || "pic");
        } else {
          setHostName("Unknown Host");
        }
      } catch (err) {
        console.error("Error fetching host:", err);
        setHostName("Unknown Host");
      }
    };

    fetchHostInfo();
  }, [listing]); // Runs when listing changes

  if (!listing) {
    return (
      <>
        <Navbar />
        <div className="mt-24 text-center text-gray-600">Loading...</div>
      </>
    );
  }

  const images = Array.isArray(listing.images) ? listing.images : [listing.images];
  const listingDetails = listing.guests + " guest/s • " + listing.bedrooms + " bedroom/s • " + listing.bathrooms + " bath/s";

  return (
    <div className="bg-beige min-h-screen">
      <Navbar />
      <div className="px-10 lg:px-20 pt-28">
        <h1 className="text-2xl lg:text-3xl font-semibold text-olive-dark mb-2">{listing.title}</h1>
        <p className="text-gray-600 mb-6">{listing.location}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Images */}
          <div className="lg:col-span-2">
  {/* 1 Image */}
  {images.length === 1 && (
    <div className="w-full h-[450px] rounded-2xl overflow-hidden">
      <img
        src={images[0]}
        alt=""
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
      />
    </div>
  )}

  {/* 2 Images */}
  {images.length === 2 && (
    <div className="grid grid-cols-2 gap-3">
      {images.map((img, i) => (
        <div key={i} className="overflow-hidden rounded-2xl">
          <img
            src={img}
            alt=""
            className="w-full h-[400px] object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
      ))}
    </div>
  )}

  {/* 3 Images */}
  {images.length === 3 && (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-1 overflow-hidden rounded-2xl">
        <img
          src={images[0]}
          alt=""
          className="w-full h-[400px] object-cover hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="col-span-1 grid gap-3">
        {images.slice(1).map((img, i) => (
          <div key={i} className="overflow-hidden rounded-2xl">
            <img
              src={img}
              alt=""
              className="w-full h-[195px] object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        ))}
      </div>
    </div>
  )}

  {/* 4+ Images */}
  {images.length >= 4 && (
    <div className="relative">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-1 overflow-hidden rounded-2xl">
          <img
            src={images[0]}
            alt=""
            className="w-full h-[400px] object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="col-span-1 grid grid-rows-2 gap-3">
          {images.slice(1, 3).map((img, i) => (
            <div key={i} className="overflow-hidden rounded-2xl">
              <img
                src={img}
                alt=""
                className="w-full h-[195px] object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
          <button className="text-sm text-gray-800 font-medium underline text-left hover:text-gray-600 transition">
            Show all photos ({images.length})
          </button>
        </div>
      </div>
    </div>
  )}
</div>



          {/* Right Price Section */}
          {/* Booking Card */}
<div className="bg-white text-olive-dark border rounded-2xl p-6 flex flex-col h-fit shadow-lg">
  {/* Price and nights */}
  <div className="mb-5">
    <h2 className="text-2xl font-bold">
      ₱{listing.price}
      <span className="text-gray-600 text-base font-normal"> / night</span>
    </h2>
    <p className="text-gray-600 text-sm mt-1">Includes taxes and fees</p>
  </div>

  {/* Date selection */}
  <div className="grid grid-cols-2 border rounded-lg overflow-hidden">
    <div className="p-3 border-r">
      <label className="block text-xs font-semibold text-olive mb-1">CHECK-IN</label>
      <input
        type="date"
        className="w-full text-sm border-none focus:ring-0 text-gray-800"
      />
    </div>
    <div className="p-3">
      <label className="block text-xs font-semibold text-olive mb-1">CHECK-OUT</label>
      <input
        type="date"
        className="w-full text-sm border-none focus:ring-0 text-gray-800"
      />
    </div>
  </div>

  {/* Guests */}
  <div className="border rounded-lg mt-2 p-3">
    <label className="block text-xs font-semibold text-olive mb-1">GUESTS</label>
    <select className="w-full text-sm border-none focus:ring-0 text-gray-800">
      <option>1 guest</option>
      <option>2 guests</option>
      <option>3 guests</option>
      <option>4 guests</option>
      <option>5+ guests</option>
    </select>
  </div>

  {/* Rates */}
  

  {/* Reserve Button */}
  <button className="mt-6 bg-olive-dark text-white font-semibold py-3 rounded-lg hover:opacity-90 transition">
    Reserve
  </button>

  {/* Host Info */}
  <div className="mt-6 flex items-center gap-3 border-t pt-4">
    <img
      src={hostPic}
      alt="Host"
      className="w-10 h-10 rounded-full object-cover"
    />
    <div>
      <p className="font-medium">Hosted by {hostName}</p>
      <p className="text-gray-600 text-sm">
        {listing.rating || "4.95"} ({listing.reviews || "150"} reviews)
      </p>
    </div>
  </div>
</div>

        </div>

        <div className="mt-10 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
  <h3 className="text-2xl font-semibold text-olive-dark mb-3">
    About this place
  </h3>

  <p className="text-gray-800 leading-relaxed text-[17px]">
    {listingDetails}
  </p>

  <div className="mt-6 border-t border-gray-100 pt-5">
    <p className="text-gray-600 text-base leading-relaxed">
      {listing.description}
    </p>
  </div>
</div>

      </div>
      <Footer />
    </div>
        
  );
};

export default ListingDetails;
