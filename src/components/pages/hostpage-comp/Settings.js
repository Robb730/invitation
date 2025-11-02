import React, { useState, useEffect } from "react";
import { db, auth } from "../../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { AiOutlineCamera } from "react-icons/ai";

const Settings = () => {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ Upload image to Cloudinary
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "kubo_unsigned"); // your preset

    const res = await fetch(`https://api.cloudinary.com/v1_1/dujq9wwzf/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Upload failed");
    return data.secure_url;
  };

  // ✅ Listen for auth user and fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setUser({ id: currentUser.uid, ...data });
          setFullName(data.name || data.fullName || "");
          setEmail(data.email || currentUser.email || "");
          setProfilePic(data.profilePic || "");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // ✅ Show preview of new image
  useEffect(() => {
    if (!newProfilePic) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(newProfilePic);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [newProfilePic]);

  const handleProfilePicChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewProfilePic(e.target.files[0]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return alert("No user logged in.");

    setLoading(true);
    try {
      const userRef = doc(db, "users", user.id);
      const updatedData = { fullName };

      // ✅ Resize before upload
      const resizeImage = (file, maxWidth = 800, maxHeight = 800) => {
        return new Promise((resolve) => {
          const img = document.createElement("img");
          const reader = new FileReader();
          reader.onload = (e) => (img.src = e.target.result);
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            if (width > height && width > maxWidth) {
              height = Math.round((height *= maxWidth / width));
              width = maxWidth;
            } else if (height > maxHeight) {
              width = Math.round((width *= maxHeight / height));
              height = maxHeight;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.8);
          };
          reader.readAsDataURL(file);
        });
      };

      if (newProfilePic) {
        const resized = await resizeImage(newProfilePic);
        const url = await uploadToCloudinary(resized);
        updatedData.profilePic = url;
        setProfilePic(url);
      }

      await updateDoc(userRef, updatedData);
      setUser((prev) => ({ ...prev, ...updatedData }));
      alert("Profile updated successfully!");
      setNewProfilePic(null);
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-olive-dark mb-6">Settings</h2>
      <p className="text-gray-600 mb-8">
        Manage your profile and contact information.
      </p>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Picture */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src={preview || profilePic || "/default-profile.png"}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-olive-dark"
            />
            <label className="absolute bottom-0 right-0 bg-olive-dark p-2 rounded-full cursor-pointer hover:opacity-90 transition">
              <AiOutlineCamera className="text-white text-lg" />
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePicChange}
                className="hidden"
              />
            </label>
          </div>
          {newProfilePic && (
            <p className="text-sm text-gray-600">New picture ready to upload</p>
          )}
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-olive-dark"
            placeholder="John Doe"
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={loading}
          className="bg-olive-dark text-white font-medium px-6 py-2 rounded-lg hover:opacity-90 transition-all"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default Settings;
