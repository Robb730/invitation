import React, { useState, useRef, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../../../firebaseConfig";
import { useNavigate } from "react-router-dom";


import "leaflet/dist/leaflet.css";

import MapSection from "../hostpage-comp/MapSection";
import { updateHostPoints } from "../../../utils/pointSystem";

import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

const HostNav = ({ user, toggleSidebar }) => {
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const [fullname, setFullName] = useState("");
  const [profile, setProfile] = useState("");

  //map container
  // Modal form states
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState("");

  const [priceType, setPriceType] = useState("per night");
  const [guests, setGuests] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");

  const [superCategory, setSuperCategory] = useState("");
  const [showTypeModal, setShowTypeModal] = useState(false);

  const CATEGORY_OPTIONS = {
    Homes: ["Beachfront", "Cabin", "Apartment", "Resort", "Tiny Home", "Villa"],
    Experiences: [
      "City Tour",
      "Hiking Adventure",
      "Cooking Class",
      "Cultural Show",
    ],
    Services: ["Chef", "Makeup Artist", "Photographer", "Tour Guide", "Driver"],
  };

  const [lat, setLat] = useState(14.5995); // default center (e.g., Baliwag)
  const [lng, setLng] = useState(120.9842);

  const [duration, setDuration] = useState(""); // for Experiences
  const [schedule, setSchedule] = useState("");

  const [experienceLevel, setExperienceLevel] = useState(""); // for Services

  const [maxGuests, setMaxGuests] = useState("");

  const [points, setPoints] = useState(0);
  const [tier, setTier] = useState("Bronze");

  const [showPointsModal, setShowPointsModal] = useState(false);

  const getNextTierInfo = (points) => {
    if (points < 200)
      return { current: "Bronze", next: "Silver", required: 200 };
    if (points < 500) return { current: "Silver", next: "Gold", required: 500 };
    if (points < 1000)
      return { current: "Gold", next: "Platinum", required: 1000 };
    if (points < 2000)
      return { current: "Platinum", next: "Diamond", required: 2000 };
    if (points < 4000)
      return { current: "Diamond", next: "Hiraya Host", required: 4000 };
    return { current: "Hiraya Host", next: "Maxed", required: 4000 };
  };

  const { next, required } = getNextTierInfo(points);
  const progressPercent = Math.min((points / required) * 100, 100);

  const getTierColor = (tier) => {
    switch (tier) {
      case "Bronze":
        return "bg-amber-600";
      case "Silver":
        return "bg-gray-400";
      case "Gold":
        return "bg-yellow-500";
      case "Platinum":
        return "bg-blue-400";
      case "Diamond":
        return "bg-cyan-400";
      case "Hiraya Host":
        return "bg-purple-500";
      default:
        return "bg-amber-600";
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".points-dropdown")) {
        setShowPointsModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🟢 Fetch user info (name + profile)
  // 🟢 Fetch user info + Points & Rewards
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            setFullName(data.fullName || "No name");
            setProfile(data.profilePic || "");

            // 🟢 Handle Points initialization
            const pointsRef = doc(db, "hostPoints", user.uid);
            const pointsSnap = await getDoc(pointsRef);
            if(pointsSnap.exists()){
              const pointsData = pointsSnap.data();
              setPoints(pointsData.points || 0);
              setTier(pointsData.tier || "Bronze");
            } else {
              console.log("No points data found for user.");
            }

            
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // 🟢 Upload image to ImgBB
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "kubo_unsigned"); // your preset name

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/dujq9wwzf/image/upload`,
      { method: "POST", body: formData }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Upload failed");
    return data.secure_url; // image URL
  };

  // 🟢 Logout or login redirect
  const handleAuthClick = async () => {
    if (user) {
      try {
        await signOut(auth);
        alert("Logged out successfully!");
        navigate("/");
      } catch (error) {
        alert(error.message);
      }
    } else {
      navigate("/login");
    }
  };

  // 🟢 Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🟢 Save as Draft
  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!user) return alert("You must be logged in.");
    if (images.length === 0) return alert("Please add at least one image.");
    if (images.length > 4) return alert("You can upload up to 4 images only.");

    try {
      const uploadedURLs = await Promise.all(
        images.map((img) => uploadToCloudinary(img))
      );
      await addDoc(collection(db, "listings"), {
        superCategory,
        title,
        location,
        category,
        status: "Active", // or Draft
        price,
        priceType,
        guests,
        bedrooms,
        bathrooms,
        description,
        images: uploadedURLs,
        promoCode: promoCode || null,
        discount: discount ? parseFloat(discount) : null,
        createdAt: serverTimestamp(),
        hostId: user.uid,
        latitude: lat,
        longitude: lng,
      });

      alert("Listing saved as draft!");
      resetForm();
    } catch (err) {
      alert("Error adding listing: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // 🟢 Publish Listing
  const handleAddListing = async (e) => {
    e.preventDefault();
    if (!user) return alert("You must be logged in.");
    if (images.length === 0) return alert("Please add at least one image.");
    if (images.length > 4) return alert("You can upload up to 4 images only.");

    try {
      if (superCategory === "Homes") {
        setUploading(true);
        const uploadedURLs = await Promise.all(
          images.map((img) => uploadToCloudinary(img))
        );
        await addDoc(collection(db, "listings"), {
          superCategory,
          title,
          location,
          category,
          status: "Active",
          price,
          priceType,
          guests,
          bedrooms,
          bathrooms,
          description,
          images: uploadedURLs,
          promoCode: promoCode || null,
          discount: discount ? parseFloat(discount) : null,
          createdAt: serverTimestamp(),
          hostId: user.uid,

          latitude: lat,
          longitude: lng,
        });
      } else if (superCategory === "Experiences") {
        setUploading(true);
        const uploadedURLs = await Promise.all(
          images.map((img) => uploadToCloudinary(img))
        );
        await addDoc(collection(db, "listings"), {
          superCategory,
          title,
          location,
          category,
          status: "Active",
          price,
          priceType,
          duration,
          schedule,
          maxGuests: maxGuests ? parseInt(maxGuests) : null,
          description,
          images: uploadedURLs,
          promoCode: promoCode || null,
          discount: discount ? parseFloat(discount) : null,
          createdAt: serverTimestamp(),
          hostId: user.uid,

          latitude: lat,
          longitude: lng,
        });
      } else if (superCategory === "Services") {
        setUploading(true);
        const uploadedURLs = await Promise.all(
          images.map((img) => uploadToCloudinary(img))
        );
        await addDoc(collection(db, "listings"), {
          superCategory,
          title,
          location,
          category,
          status: "Active",
          price,
          priceType,
          experienceLevel,
          description,
          images: uploadedURLs,
          promoCode: promoCode || null,
          discount: discount ? parseFloat(discount) : null,
          createdAt: serverTimestamp(),
          hostId: user.uid,

          latitude: lat,
          longitude: lng,
        });
      }
      updateHostPoints(user.uid, 50);
      alert("Listing published successfully!\nYou earned 50 points.");
      resetForm();
    } catch (err) {
      alert("Error adding listing: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setTitle("");
    setLocation("");
    setCategory("");
    setPrice("");
    setDescription("");
    setImages([]);
  };

  return (
    <>
      {/* 🟢 Navbar */}
      {/* 🟢 Navbar */}
      <div className="fixed top-0 w-full h-16 bg-white/40 backdrop-blur-md border-b border-white/30 flex items-center justify-between px-5 md:px-10 z-50 shadow-md">
        {/* Left: Hamburger + Title */}
        <div className="flex items-center gap-3">
          {/* Hamburger for Sidebar */}
          <button
            className="text-olive-dark text-2xl md:hidden"
            onClick={toggleSidebar}
          >
            ☰
          </button>

          {/* Title */}
          <h1 className="text-xl md:text-2xl font-bold text-olive-dark tracking-tight">
            KuboHub <span className="font-light opacity-70">Host</span>
          </h1>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* 🟢 Points on Desktop */}
          <div className="hidden md:block relative points-dropdown">
            <div className="relative">
              <div
                onClick={() => setShowPointsModal(!showPointsModal)}
                className="flex items-center gap-2 cursor-pointer bg-white/60 hover:bg-white/80 border border-white/60 px-3 py-1 rounded-full shadow-sm transition"
              >
                <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getTierColor(
                      tier
                    )}`}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-olive-dark">
                  {tier}
                </span>
              </div>

              {/* Points Modal */}
              {showPointsModal && (
                <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-60 animate-fade-in">
                  <h3 className="text-sm font-semibold text-olive-dark mb-1">
                    Points & Rewards
                  </h3>
                  <p className="text-xs text-gray-700 mb-1">
                    Current Tier: <span className="font-medium">{tier}</span>
                  </p>
                  <p className="text-xs text-gray-600 mb-2">
                    {points} pts • Next Tier:{" "}
                    {next === "Maxed"
                      ? "🎉 You’ve reached Hiraya Host!"
                      : `${next} (${required - points} pts left)`}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full ${getTierColor(
                        tier
                      )} transition-all duration-500`}
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-gray-500 italic text-right">
                    {next === "Maxed"
                      ? "You’ve reached the top!"
                      : `Keep earning to reach ${next}`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 🟢 Add Listing Button (Desktop Only) */}
          <button
            onClick={() => setShowTypeModal(true)}
            className="hidden md:block bg-olive text-white font-medium px-5 py-2 rounded-xl hover:bg-olive-dark transition duration-300"
          >
            Add New Listing
          </button>

          {/* 🟢 Profile (All screens) */}
          <div className="relative">
            

            {/* Dropdown */}
            {open && (
              <div
                ref={menuRef}
                className="absolute -right-16 top-8 bg-white backdrop-blur-md border border-white/40 rounded-xl shadow-lg py-2 w-40 flex flex-col text-olive-dark text-sm animate-fade-in"
              >
                <div className="px-4 py-2 text-left text-black text-sm font-medium border-b border-gray-200">
                  {fullname || "Loading..."}
                </div>
                <button className="px-4 py-2 text-left hover:bg-olive/40 transition">
                  View Profile
                </button>
                <button
                  onClick={handleAuthClick}
                  className="px-4 py-2 text-left hover:bg-olive/40 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* 🟢 Mobile Tier Text + Floating Add Icon */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setShowTypeModal(true)}
              className="bg-olive text-white p-1 px-2 rounded-full shadow-md hover:bg-olive-dark transition"
            >
              <span className="text-lg leading-none font-bold">+</span>
            </button>
            <span
  onClick={() => setShowPointsModal(true)}
  className="text-xs font-medium text-olive-dark cursor-pointer"
>
  {tier}
</span>
            
          </div>
          <img
              src={
                profile && profile.startsWith("http")
                  ? profile
                  : "https://via.placeholder.com/40"
              }
              alt="Host Profile"
              className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-white/60 shadow cursor-pointer object-cover"
              onClick={() => setOpen(!open)}
            />
        </div>
      </div>

      {showTypeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-[90%] max-w-sm text-center">
            <h2 className="text-xl font-semibold text-olive-dark mb-3">
              What kind of listing are you adding?
            </h2>
            <p className="text-sm text-gray-600 mb-5">
              Choose one to continue.
            </p>

            <div className="flex flex-col gap-3">
              {["Homes", "Experiences", "Services"].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSuperCategory(type);
                    setShowTypeModal(false);
                    setShowModal(true);
                  }}
                  className="py-2 rounded-lg bg-olive-dark text-white hover:bg-olive transition"
                >
                  {type}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowTypeModal(false)}
              className="mt-4 text-gray-500 hover:text-olive-dark text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 🟢 Modal for New Listing */}
      {/* 🟢 Modal for New Listing */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white/95 backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-2xl w-[95%] max-w-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-semibold text-olive-dark mb-2 text-center">
              Add New Listing
            </h2>
            <p className="text-sm text-gray-600 text-center mb-5">
              Fill in all the details to make your listing stand out.
            </p>

            <form onSubmit={handleAddListing} className="flex flex-col gap-5">
              {/* ✅ Shared Fields (Title + Map for All) */}
              <div>
                <label className="block text-sm font-medium text-olive-dark mb-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Cozy Cabin or Guided City Tour"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-olive-dark mb-1">
                  Select Location
                </label>
                <div className="rounded-xl border border-gray-300 overflow-hidden">
                  <div style={{ height: "250px", width: "100%" }}>
                    <MapSection
                      lat={lat}
                      lng={lng}
                      setLat={setLat}
                      setLng={setLng}
                      setSelectedAddress={setLocation}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-700 mt-2">
                  📌 Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}
                </p>
                <p className="text-sm text-gray-500 italic">
                  🗺️ {location || "Click on the map to choose a location"}
                </p>
              </div>

              {/* ✅ Conditional Fields by SuperCategory */}
              {superCategory === "Homes" && (
                <>
                  {/* Keep your existing Homes form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                      required
                    >
                      <option value="">Select Category</option>
                      {CATEGORY_OPTIONS["Homes"]?.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-2/3 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                        required
                      />
                      <select
                        className="w-1/3 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                        value={priceType}
                        onChange={(e) => setPriceType(e.target.value)}
                      >
                        <option value="per night">/ Night</option>
                        <option value="per week">/ Week</option>
                        <option value="per month">/ Month</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="number"
                      placeholder="Guests"
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Bedrooms"
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Bathrooms"
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                      className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                    />
                  </div>
                </>
              )}

              {/* ✅ Experiences Fields */}
              {superCategory === "Experiences" && (
                <>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                    required
                  >
                    <option value="">Select Experience Type</option>
                    {CATEGORY_OPTIONS["Experiences"]?.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Duration (e.g., 3 hours)"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Schedule (e.g., Weekends Only)"
                      value={schedule}
                      onChange={(e) => setSchedule(e.target.value)}
                      className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                    />
                  </div>
                  {/* NEW FIELD for guest capacity */}
                  <input
                    type="number"
                    placeholder="Max Guests (e.g., 30)"
                    value={maxGuests}
                    onChange={(e) => setMaxGuests(e.target.value)}
                    className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                  />

                  <div className="mb-2 flex gap-2 ">
                    <input
                      type="number"
                      placeholder="Price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                      required
                    />
                    <select
                      value={priceType}
                      onChange={(e) => setPriceType(e.target.value)}
                      className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                    >
                      <option value="per person">/ Person</option>
                    </select>
                  </div>
                </>
              )}

              {/* ✅ Services Fields */}
              {superCategory === "Services" && (
                <>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                    required
                  >
                    <option value="">Select Service Type</option>
                    {CATEGORY_OPTIONS["Services"]?.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Experience Level (e.g., 5 years)"
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                    />
                    <select
                      value={priceType}
                      onChange={(e) => setPriceType(e.target.value)}
                      className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                    >
                      <option value="per hour">/ Hour</option>
                      <option value="per day">/ Day</option>
                    </select>
                  </div>

                  <input
                    type="number"
                    placeholder="Service Fee"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                    required
                  />
                </>
              )}

              {/* 💸 Promo Code and Discount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-olive-dark mb-1">
                    Promo Code (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., KUBO10"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-olive-dark mb-1">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 10"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* ✨ Description */}
              <textarea
                placeholder="Describe your listing..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none resize-none"
                required
              />

              {/* 🖼️ Image Upload (shared) */}
              <div>
                <label className="block text-sm font-medium text-olive-dark mb-2">
                  Upload Images (max 4)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setImages([...e.target.files].slice(0, 4))}
                  className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-white focus:ring-2 focus:ring-olive-dark"
                />
                {images.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Array.from(images).map((img, idx) => (
                      <img
                        key={idx}
                        src={URL.createObjectURL(img)}
                        alt="preview"
                        className="h-24 w-full object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDraft}
                  type="button"
                  className="px-5 py-2 rounded-lg text-white bg-olive-dark hover:bg-olive transition"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className={`px-6 py-2 rounded-lg text-white font-medium transition ${
                    uploading
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-olive-dark hover:bg-olive"
                  }`}
                >
                  {uploading ? "Publishing..." : "Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default HostNav;
