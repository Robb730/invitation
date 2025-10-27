import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

// ----- Main Component -----
const Listings = ({ user }) => {
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    draft: 0,
  });
  const [filter, setFilter] = useState("Active");
  const [selectedListing, setSelectedListing] = useState(null); // 👈 for modal

  // ✅ Fetch listings owned by current user
  const fetchUserListings = useCallback(async () => {
    if (!user) return;

    try {
      const listingsRef = collection(db, "listings");
      const q = query(listingsRef, where("hostId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      const listingsData = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      setListings(listingsData);

      setStats({
        total: listingsData.length,
        active: listingsData.filter((l) => l.status === "Active").length,
        inactive: listingsData.filter((l) => l.status === "Inactive").length,
        draft: listingsData.filter((l) => l.status === "Draft").length,
      });
    } catch (error) {
      console.error("Error fetching listings:", error);
    }
  }, [user]);
  useEffect(() => {
    fetchUserListings();
  }, [fetchUserListings]);
  useEffect(() => {
    const refreshHandler = () => fetchUserListings();
    window.addEventListener("refreshListings", refreshHandler);
    return () => window.removeEventListener("refreshListings", refreshHandler);
  }, [fetchUserListings]); 

  // 🔹 Filter listings by selected status
  const filteredListings = listings.filter((l) => l.status === filter);

  // 🔹 Handle modal save (Firestore update)
  const handleSaveChanges = async (updatedListing) => {
    try {
      const listingRef = doc(db, "listings", updatedListing.id);
      await updateDoc(listingRef, updatedListing);
      alert("Listing updated successfully!");

      // 🔄 Update UI instantly without refetch
      setListings((prev) =>
        prev.map((l) => (l.id === updatedListing.id ? updatedListing : l))
      );

      setSelectedListing(null); // Close modal
    } catch (error) {
      console.error("Error updating listing:", error);
      
    }
  };

  return (
    <div className="min-h-screen bg-beige p-10 mt-0">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 mt-0">
        <h1 className="text-3xl font-semibold text-olive-dark">My Listings</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatsCard title="Total Listings" count={stats.total} bg="bg-white/60" text="text-olive-dark" />
        <StatsCard title="Active Listings" count={stats.active} bg="bg-green-50" text="text-green-800" onClick={() => setFilter("Active")} />
        <StatsCard title="Inactive Listings" count={stats.inactive} bg="bg-red-50" text="text-red-800" onClick={() => setFilter("Inactive")} />
        <StatsCard title="Draft Listings" count={stats.draft} bg="bg-yellow-100" text="text-yellow-800" onClick={() => setFilter("Draft")} />
      </div>

      {/* Listings Grid */}
      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onEdit={() => setSelectedListing(listing)} />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-600 mt-20">
          <p>No {filter.toLowerCase()} listings found.</p>
        </div>
      )}

      {/* 🟢 Edit Modal */}
      {selectedListing && (
        <EditModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onSave={handleSaveChanges}
        />
      )}
    </div>
  );
};

// ----- Listing Card -----
const ListingCard = ({ listing, onEdit }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef(null);

  const images = useMemo(() => {
    if (!listing.images) return [];
    return Array.isArray(listing.images) ? listing.images : [listing.images];
  }, [listing.images]);

  useEffect(() => {
    if (isHovered && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 1500);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isHovered, images.length]);

  const statusColor =
    {
      Active: "bg-green-100 text-green-700",
      Inactive: "bg-gray-300 text-gray-700",
      Draft: "bg-yellow-100 text-yellow-800",
    }[listing.status] || "bg-gray-300 text-gray-700";

  return (
    <div
      className="bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl p-4 shadow-md hover:scale-[1.02] transition duration-300 relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCurrentImageIndex(0);
      }}
    >
      <div className="relative w-full h-48 rounded-xl overflow-hidden">
        {images.length > 0 ? (
          images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={listing.title}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                idx === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-200 text-gray-500">
            No image
          </div>
        )}
      </div>

      <h3 className="text-lg font-semibold text-olive-dark mt-4">
        {listing.title || "Untitled Listing"}
      </h3>
      <p className="text-sm text-olive-dark/70 mt-1">{listing.location || "No location"}</p>
      <p className="text-sm text-olive-dark/90 mt-2 font-medium">₱{listing.price || "0"}</p>

      <div className="flex justify-between items-center mt-4">
        <span className={`${statusColor} px-3 py-1 rounded-full text-xs font-medium`}>
          {listing.status}
        </span>
        <button className="text-sm font-medium text-olive-dark hover:underline" onClick={onEdit}>
          Edit
        </button>
      </div>
    </div>
  );
};

// ----- Stats Card -----
const StatsCard = ({ title, count, bg, text, onClick }) => (
  <div
    className={`${bg} border border-white/30 rounded-2xl p-4 md:p-6 text-center shadow-md w-full sm:w-48 cursor-pointer`}
  onClick={onClick}
  >
    <h3 className={`text-xl font-semibold ${text}`}>{title}</h3>
    <p className={`text-3xl font-bold ${text} mt-2`}>{count}</p>
  </div>
);

// ----- Edit Modal -----
const EditModal = ({ listing, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: listing.title || "",
    location: listing.location || "",
    category: listing.category || "",
    price: listing.price || "",
    priceType: listing.priceType || "per night",
    guests: listing.guests || "",
    bedrooms: listing.bedrooms || "",
    bathrooms: listing.bathrooms || "",
    promoCode: listing.promoCode || "",
    discount: listing.discount || "",
    description: listing.description || "",
    status: listing.status || "Active",
    images: listing.images || [],
  });
  const [newImages, setNewImages] = useState([]); // newly added files
  const [uploading, setUploading] = useState(false);

  const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "kubo_unsigned");
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/dujq9wwzf/image/upload`,
    { method: "POST", body: formData }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Upload failed");
  return data.secure_url;
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeleteImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = formData.images.length + files.length;
    if (totalImages > 4) {
      alert("You can upload up to 4 images only.");
      return;
    }
    setNewImages(files);
  };

  const handleSubmit = async () => {
    try {
      setUploading(true);
      let uploadedURLs = [];

      // Upload new images if any
      if (newImages.length > 0) {
        uploadedURLs = await Promise.all(newImages.map((img) => uploadToCloudinary(img)));
      }

      const updatedListing = {
        ...listing,
        ...formData,
        images: [...formData.images, ...uploadedURLs],
      };

      await onSave(updatedListing);
      setUploading(false);
    } catch (error) {
      console.error("Error saving listing:", error);
      alert("Error saving changes: " + error.message);
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      try {
        const listingRef = doc(db, "listings", listing.id);
        await deleteDoc(listingRef);
        alert("Listing deleted successfully!");
        onClose();
        window.dispatchEvent(new Event("refreshListings"));
      } catch (error) {
        console.error("Error deleting listing:", error);
        alert("Failed to delete listing.");
      }
    }
  };



  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm px-3">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl p-4 md:p-6 relative overflow-y-auto max-h-[90vh]">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-olive-dark mb-4 text-center">
          Edit Listing
        </h2>

        <div className="flex flex-col gap-4">
          {/* Title and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Title"
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-olive/50"
            />
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Location"
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-olive/50"
            />
          </div>

          {/* Category and Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-olive/50"
            >
              <option value="">Select Category</option>
              <option value="Beachfront">Beachfront</option>
              <option value="Cabin">Cabin</option>
              <option value="Apartment">Apartment</option>
              <option value="Resort">Resort</option>
              <option value="Tiny Home">Tiny Home</option>
              <option value="Villa">Villa</option>
            </select>

            <div className="flex gap-2">
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Price"
                className="w-2/3 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-olive/50"
              />
              <select
                name="priceType"
                value={formData.priceType}
                onChange={handleChange}
                className="w-1/3 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-olive/50"
              >
                <option value="per night">/ Night</option>
                <option value="per week">/ Week</option>
                <option value="per month">/ Month</option>
              </select>
            </div>
          </div>

          {/* Guests, Bedrooms, Bathrooms */}
          <div className="grid grid-cols-3 gap-3">
            <input
              type="number"
              name="guests"
              value={formData.guests}
              onChange={handleChange}
              placeholder="Guests"
              min="1"
              className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-olive/50"
            />
            <input
              type="number"
              name="bedrooms"
              value={formData.bedrooms}
              onChange={handleChange}
              placeholder="Bedrooms"
              min="0"
              className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-olive/50"
            />
            <input
              type="number"
              name="bathrooms"
              value={formData.bathrooms}
              onChange={handleChange}
              placeholder="Bathrooms"
              min="0"
              className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-olive/50"
            />
          </div>

          {/* Promo & Discount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              name="promoCode"
              value={formData.promoCode}
              onChange={handleChange}
              placeholder="Promo Code (optional)"
              className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-olive/50"
            />
            <input
              type="number"
              name="discount"
              value={formData.discount}
              onChange={handleChange}
              placeholder="Discount (%)"
              min="1"
              max="100"
              className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-olive/50"
            />
          </div>

          {/* Description */}
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description"
            rows="4"
            className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-olive/50 resize-none"
          ></textarea>

          {/* Images */}
          <div>
            <label className="font-medium text-olive-dark mb-2 block">
              Images (max 4)
            </label>

            {/* Existing Images */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {formData.images.map((img, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={img}
                    alt="listing"
                    className="h-24 w-full object-cover rounded-lg border"
                  />
                  <button
                    onClick={() => handleDeleteImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Upload New Images */}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleNewImages}
              className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-white"
            />
          </div>

          {/* Status */}
          <div>
            <label className="font-medium text-olive-dark">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-olive/50"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-between mt-6">
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className={`bg-olive-dark text-white py-2 rounded-lg w-44 hover:bg-olive transition duration-300 font-medium ${
                uploading ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {uploading ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-900 text-white py-2 rounded-lg w-44 hover:bg-red-700 transition duration-300 font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Listings;
