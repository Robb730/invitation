import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import MapSection from "../hostpage-comp/MapSection"; // adjust path if necessary

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
  const [selectedListing, setSelectedListing] = useState(null); // for modal

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
      // Prepare payload: remove any local-only keys if present
      const payload = {
        title: updatedListing.title,
        location: updatedListing.location,
        category: updatedListing.category,
        status: updatedListing.status,
        price: typeof updatedListing.price === "string" ? parseFloat(updatedListing.price) : updatedListing.price,
        priceType: updatedListing.priceType,
        guests: updatedListing.guests ? parseInt(updatedListing.guests) : null,
        bedrooms: updatedListing.bedrooms ? parseInt(updatedListing.bedrooms) : null,
        bathrooms: updatedListing.bathrooms ? parseInt(updatedListing.bathrooms) : null,
        description: updatedListing.description,
        images: updatedListing.images || [],
        promoCode: updatedListing.promoCode || null,
        discount: updatedListing.discount ? parseFloat(updatedListing.discount) : null,
        latitude: updatedListing.latitude || null,
        longitude: updatedListing.longitude || null,
        // keep hostId/createdAt untouched
      };

      await updateDoc(listingRef, payload);

      // Update UI instantly without full refetch
      setListings((prev) =>
        prev.map((l) => (l.id === updatedListing.id ? { ...l, ...payload } : l))
      );

      alert("Listing updated successfully!");
      setSelectedListing(null);
      window.dispatchEvent(new Event("refreshListings"));
    } catch (error) {
      console.error("Error updating listing:", error);
      alert("Failed to update listing: " + (error.message || error));
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

      {/* Edit Modal */}
      {selectedListing && (
  <>
    {selectedListing.superCategory === "Homes" && (
      <EditModalHomes
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        onSave={handleSaveChanges}
      />
    )}
    {selectedListing.superCategory === "Experiences" && (
      <EditModalExperiences
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        onSave={handleSaveChanges}
      />
    )}
    {selectedListing.superCategory === "Services" && (
      <EditModalServices
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        onSave={handleSaveChanges}
      />
    )}
  </>
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
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${idx === currentImageIndex ? "opacity-100" : "opacity-0"
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
      <p className="text-sm text-olive-dark/70 mt-1">{listing.location.split(",").slice(0, 3).join(",") || "No location"}</p>
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

// ----- Edit Modal (mirrors Add Listing modal + MapSection) -----
const EditModalHomes = ({ listing, onClose, onSave }) => {
  // initialize controlled states with listing values
  const [title, setTitle] = useState(listing.title || "");
  const [category, setCategory] = useState(listing.category || "");
  const [status, setStatus] = useState(listing.status || "Active");
  const [price, setPrice] = useState(listing.price ?? "");
  const [priceType, setPriceType] = useState(listing.priceType || "per night");
  const [guests, setGuests] = useState(listing.guests ?? "");
  const [bedrooms, setBedrooms] = useState(listing.bedrooms ?? "");
  const [bathrooms, setBathrooms] = useState(listing.bathrooms ?? "");
  const [promoCode, setPromoCode] = useState(listing.promoCode || "");
  const [discount, setDiscount] = useState(listing.discount ?? "");
  const [description, setDescription] = useState(listing.description || "");
  const [images, setImages] = useState(Array.isArray(listing.images) ? listing.images : (listing.images ? [listing.images] : [])); // existing image URLs
  const [newImages, setNewImages] = useState([]); // File objects to upload
  const [uploading, setUploading] = useState(false);

  // Map-related states
  const [lat, setLat] = useState(listing.latitude ?? listing.lat ?? 14.5995);
  const [lng, setLng] = useState(listing.longitude ?? listing.lng ?? 120.9842);
  const [selectedAddress, setSelectedAddress] = useState(listing.location || listing.address || "");

  // Keep form in sync when the `listing` prop changes
  useEffect(() => {
    setTitle(listing.title || "");
    setCategory(listing.category || "");
    setStatus(listing.status || "Active");
    setPrice(listing.price ?? "");
    setPriceType(listing.priceType || "per night");
    setGuests(listing.guests ?? "");
    setBedrooms(listing.bedrooms ?? "");
    setBathrooms(listing.bathrooms ?? "");
    setPromoCode(listing.promoCode || "");
    setDiscount(listing.discount ?? "");
    setDescription(listing.description || "");
    setImages(Array.isArray(listing.images) ? listing.images : (listing.images ? [listing.images] : []));
    setNewImages([]);
    setLat(listing.latitude ?? listing.lat ?? 14.5995);
    setLng(listing.longitude ?? listing.lng ?? 120.9842);
    setSelectedAddress(listing.location || listing.address || "");
  }, [listing]);

  // Cloudinary upload helper (same preset you used)
  const uploadToCloudinary = async (file) => {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", "kubo_unsigned");
    const res = await fetch("https://api.cloudinary.com/v1_1/dujq9wwzf/image/upload", {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Upload failed");
    return data.secure_url;
  };

  const handleDeleteExistingImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    const total = images.length + newImages.length + files.length;
    if (total > 4) {
      alert("You can upload up to 4 images only.");
      return;
    }
    setNewImages((prev) => [...prev, ...files]);
  };

  const handleRemoveNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);
      // upload new images if any
      let uploadedURLs = [];
      if (newImages.length > 0) {
        uploadedURLs = await Promise.all(newImages.map((f) => uploadToCloudinary(f)));
      }

      const updatedImages = [...images, ...uploadedURLs].slice(0, 4);

      const updatedListing = {
        ...listing,
        title,
        category,
        status,
        price: price !== "" ? (typeof price === "string" ? parseFloat(price) : price) : null,
        priceType,
        guests: guests !== "" ? parseInt(guests) : null,
        bedrooms: bedrooms !== "" ? parseInt(bedrooms) : null,
        bathrooms: bathrooms !== "" ? parseInt(bathrooms) : null,
        promoCode: promoCode || null,
        discount: discount !== "" ? parseFloat(discount) : null,
        description,
        images: updatedImages,
        latitude: lat,
        longitude: lng,
        location: selectedAddress || "",
      };

      await onSave(updatedListing); // parent updates Firestore
      setUploading(false);
    } catch (error) {
      console.error("Error saving listing:", error);
      alert("Error saving changes: " + (error.message || error));
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
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
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm px-3">
      <div className="bg-white/95 backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-2xl w-[95%] max-w-2xl overflow-y-auto max-h-[90vh]">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="text-2xl font-semibold text-olive-dark mb-2 text-center">
          Edit Listing
        </h2>
        <p className="text-sm text-gray-600 text-center mb-5">
          Update the details below and click Save Changes.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-olive-dark mb-1">Property Title</label>
            <input
              type="text"
              placeholder="e.g., Cozy Cabin near the Beach"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
              required
            />
          </div>

          {/* Map Picker */}
          <div>
            <label className="block text-sm font-medium text-olive-dark mb-1">Select Property Location</label>
            <div className="rounded-xl border border-gray-300 overflow-hidden">
              <div style={{ height: "250px", width: "100%" }}>
                <MapSection
                  lat={lat}
                  lng={lng}
                  setLat={(v) => setLat(v)}
                  setLng={(v) => setLng(v)}
                  setSelectedAddress={(addr) => setSelectedAddress(addr)}
                />
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-2">📌 Coordinates: {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}</p>
            <p className="text-sm text-gray-500 italic">🗺️ {selectedAddress || "Click on the map to choose a location"}</p>
          </div>

          {/* Category & Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
              required
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

          {/* Promo Code & Discount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Promo Code (optional)"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
            />
            <input
              type="number"
              placeholder="Discount (%)"
              min="1"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
            />
          </div>

          {/* Details */}
          <div className="grid grid-cols-3 gap-4">
            <input
              type="number"
              placeholder="Guests"
              min="1"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
            />
            <input
              type="number"
              placeholder="Bedrooms"
              min="0"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
            />
            <input
              type="number"
              placeholder="Bathrooms"
              min="0"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
            />
          </div>

          {/* Description */}
          <textarea
            placeholder="Describe your property..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none resize-none"
            required
          />

          {/* Images (existing + new) */}
          <div>
            <label className="block text-sm font-medium text-olive-dark mb-2">
              Upload Images (max 4)
            </label>

            {/* Existing images */}
            {images.length > 0 && (
              <div className="mb-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img src={img} alt={`listing-${idx}`} className="h-24 w-full object-cover rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => handleDeleteExistingImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New images preview */}
            {newImages.length > 0 && (
              <div className="mb-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {newImages.map((file, idx) => (
                  <div key={idx} className="relative">
                    <img src={URL.createObjectURL(file)} alt={`new-${idx}`} className="h-24 w-full object-cover rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* File input */}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleNewImages}
              className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-white focus:ring-2 focus:ring-olive-dark"
            />
          </div>

          {/* Status */}
          <div>
            <label className="font-medium text-olive-dark">Status</label>
            <select
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-olive/50"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-between mt-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-900 text-white py-2 rounded-lg w-44 hover:bg-red-700 transition duration-300 font-medium"
              >
                Delete
              </button>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className={`bg-olive-dark text-white py-2 rounded-lg w-44 hover:bg-olive transition duration-300 font-medium ${uploading ? "opacity-60 cursor-not-allowed" : ""
                }`}
            >
              {uploading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
// 🎯 EXPERIENCES MODAL
const EditModalExperiences = ({ listing, onClose, onSave }) => {
  const [title, setTitle] = useState(listing.title || "");
  const [category, setCategory] = useState(listing.category || "");
  const [price, setPrice] = useState(listing.price ?? "");
  const [priceType, setPriceType] = useState(listing.priceType || "per person");
  const [duration, setDuration] = useState(listing.duration || "");
  const [schedule, setSchedule] = useState(listing.schedule || "");
  const [promoCode, setPromoCode] = useState(listing.promoCode || "");
  const [discount, setDiscount] = useState(listing.discount ?? "");
  const [description, setDescription] = useState(listing.description || "");
  const [images, setImages] = useState(Array.isArray(listing.images) ? listing.images : []);
  const [newImages, setNewImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [lat, setLat] = useState(listing.latitude ?? 14.5995);
  const [lng, setLng] = useState(listing.longitude ?? 120.9842);
  const [selectedAddress, setSelectedAddress] = useState(listing.location || "");

  const uploadToCloudinary = async (file) => {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", "kubo_unsigned");
    const res = await fetch("https://api.cloudinary.com/v1_1/dujq9wwzf/image/upload", { method: "POST", body: form });
    const data = await res.json();
    return data.secure_url;
  };

  const handleDeleteExistingImage = (index) => setImages((prev) => prev.filter((_, i) => i !== index));
  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 4) {
      alert("You can upload up to 4 images only.");
      return;
    }
    setNewImages((prev) => [...prev, ...files]);
  };
  const handleRemoveNewImage = (index) => setNewImages((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    let uploadedURLs = [];
    if (newImages.length > 0) uploadedURLs = await Promise.all(newImages.map(uploadToCloudinary));
    const updatedListing = {
      ...listing,
      title,
      category,
      price: parseFloat(price),
      priceType,
      duration,
      schedule,
      promoCode,
      discount: discount ? parseFloat(discount) : null,
      description,
      images: [...images, ...uploadedURLs].slice(0, 4),
      latitude: lat,
      longitude: lng,
      location: selectedAddress,
    };
    await onSave(updatedListing);
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm px-3">
      <div className="bg-white/95 p-6 md:p-8 rounded-2xl shadow-2xl w-[95%] max-w-2xl overflow-y-auto max-h-[90vh] relative">
        <button className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl" onClick={onClose}>×</button>
        <h2 className="text-2xl font-semibold text-olive-dark text-center mb-2">Edit Experience</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="font-medium text-olive-dark">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="p-3 border rounded-lg w-full" required />
          </div>

          <div>
            <label className="font-medium text-olive-dark">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="p-3 border rounded-lg w-full" required>
              <option value="">Select Category</option>
              <option value="City Tour">City Tour</option>
              <option value="Hiking Adventure">Cooking Class</option>
              <option value="Cultural Show">Cultural Show</option>
            </select>
          </div>

          <div>
            <label className="font-medium text-olive-dark">Duration</label>
            <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} className="p-3 border rounded-lg w-full" />
          </div>

          <div>
            <label className="font-medium text-olive-dark">Schedule</label>
            <input type="text" value={schedule} onChange={(e) => setSchedule(e.target.value)} className="p-3 border rounded-lg w-full" />
          </div>

          <div>
            <label className="font-medium text-olive-dark">Price</label>
            <div className="flex gap-2">
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="p-3 border rounded-lg w-2/3" required />
              <select value={priceType} onChange={(e) => setPriceType(e.target.value)} className="p-3 border rounded-lg w-1/3">
                <option value="per person">/ Person</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium text-olive-dark">Promo Code</label>
              <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className="p-3 border rounded-lg w-full" />
            </div>
            <div>
              <label className="font-medium text-olive-dark">Discount (%)</label>
              <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="p-3 border rounded-lg w-full" />
            </div>
          </div>

          <div>
            <label className="font-medium text-olive-dark">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="p-3 border rounded-lg w-full" required />
          </div>

          <div>
            <label className="font-medium text-olive-dark">Images (max 4)</label>
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img src={img} alt="existing" className="h-24 w-full object-cover rounded-lg border" />
                    <button type="button" onClick={() => handleDeleteExistingImage(idx)} className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded">✕</button>
                  </div>
                ))}
              </div>
            )}
            {newImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {newImages.map((file, idx) => (
                  <div key={idx} className="relative">
                    <img src={URL.createObjectURL(file)} alt="new" className="h-24 w-full object-cover rounded-lg border" />
                    <button type="button" onClick={() => handleRemoveNewImage(idx)} className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded">✕</button>
                  </div>
                ))}
              </div>
            )}
            <input type="file" accept="image/*" multiple onChange={handleNewImages} className="block w-full border p-2 rounded-lg" />
          </div>

          <MapSection lat={lat} lng={lng} setLat={setLat} setLng={setLng} setSelectedAddress={setSelectedAddress} />

          <button type="submit" disabled={uploading} className="bg-olive-dark text-white py-2 rounded-lg hover:bg-olive transition">
            {uploading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

const EditModalServices = ({ listing, onClose, onSave }) => {
  const [title, setTitle] = useState(listing.title || "");
  const [category, setCategory] = useState(listing.category || "");
  const [price, setPrice] = useState(listing.price ?? "");
  const [priceType, setPriceType] = useState(listing.priceType || "per hour");
  const [experienceLevel, setExperienceLevel] = useState(listing.experienceLevel || "");
  const [promoCode, setPromoCode] = useState(listing.promoCode || "");
  const [discount, setDiscount] = useState(listing.discount ?? "");
  const [description, setDescription] = useState(listing.description || "");
  const [images, setImages] = useState(Array.isArray(listing.images) ? listing.images : []);
  const [newImages, setNewImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [lat, setLat] = useState(listing.latitude ?? 14.5995);
  const [lng, setLng] = useState(listing.longitude ?? 120.9842);
  const [selectedAddress, setSelectedAddress] = useState(listing.location || "");

  const uploadToCloudinary = async (file) => {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", "kubo_unsigned");
    const res = await fetch("https://api.cloudinary.com/v1_1/dujq9wwzf/image/upload", { method: "POST", body: form });
    const data = await res.json();
    return data.secure_url;
  };

  const handleDeleteExistingImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));
  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 4) return alert("You can upload up to 4 images only.");
    setNewImages((prev) => [...prev, ...files]);
  };
  const handleRemoveNewImage = (i) => setNewImages((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    const uploadedURLs = newImages.length > 0 ? await Promise.all(newImages.map(uploadToCloudinary)) : [];
    const updatedListing = {
      ...listing,
      title,
      category,
      price: parseFloat(price),
      priceType,
      experienceLevel,
      promoCode,
      discount: discount ? parseFloat(discount) : null,
      description,
      images: [...images, ...uploadedURLs].slice(0, 4),
      latitude: lat,
      longitude: lng,
      location: selectedAddress,
    };
    await onSave(updatedListing);
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 backdrop-blur-sm px-3">
      <div className="bg-white/95 p-6 md:p-8 rounded-2xl shadow-2xl w-[95%] max-w-2xl overflow-y-auto max-h-[90vh] relative">
        <button className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl" onClick={onClose}>×</button>
        <h2 className="text-2xl font-semibold text-olive-dark text-center mb-2">Edit Service</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="font-medium text-olive-dark">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="p-3 border rounded-lg w-full" required />
          </div>

          <div>
            <label className="font-medium text-olive-dark">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="p-3 border rounded-lg w-full" required>
              <option value="">Select Category</option>
              <option value="Chef">Chef</option>
              <option value="Makeup Artist">Makeup Artist</option>
              <option value="Photographer">Photographer</option>
              <option value="Tour Guide">Tour Guide</option>
              <option value="Driver">Driver</option>
            </select>
          </div>

          <div>
            <label className="font-medium text-olive-dark">Experience Level</label>
            <input type="text" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className="p-3 border rounded-lg w-full" />
          </div>

          <div>
            <label className="font-medium text-olive-dark">Price</label>
            <div className="flex gap-2">
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="p-3 border rounded-lg w-2/3" required />
              <select value={priceType} onChange={(e) => setPriceType(e.target.value)} className="p-3 border rounded-lg w-1/3">
                <option value="per hour">/ Hour</option>
                <option value="per day">/ Day</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium text-olive-dark">Promo Code</label>
              <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className="p-3 border rounded-lg w-full" />
            </div>
            <div>
              <label className="font-medium text-olive-dark">Discount (%)</label>
              <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="p-3 border rounded-lg w-full" />
            </div>
          </div>

          <div>
            <label className="font-medium text-olive-dark">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="p-3 border rounded-lg w-full" required />
          </div>

          <div>
            <label className="font-medium text-olive-dark">Images (max 4)</label>
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {images.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} alt="existing" className="h-24 w-full object-cover rounded-lg border" />
                    <button type="button" onClick={() => handleDeleteExistingImage(i)} className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded">✕</button>
                  </div>
                ))}
              </div>
            )}
            {newImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {newImages.map((file, i) => (
                  <div key={i} className="relative">
                    <img src={URL.createObjectURL(file)} alt="preview" className="h-24 w-full object-cover rounded-lg border" />
                    <button type="button" onClick={() => handleRemoveNewImage(i)} className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded">✕</button>
                  </div>
                ))}
              </div>
            )}
            <input type="file" accept="image/*" multiple onChange={handleNewImages} className="block w-full border p-2 rounded-lg" />
          </div>

          <MapSection lat={lat} lng={lng} setLat={setLat} setLng={setLng} setSelectedAddress={setSelectedAddress} />

          <button type="submit" disabled={uploading} className="bg-olive-dark text-white py-2 rounded-lg hover:bg-olive transition">
            {uploading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};




export default Listings;
