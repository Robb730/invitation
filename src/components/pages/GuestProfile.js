import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Navbar from "./homepage-comp/Navbar";
import Footer from "./homepage-comp/Footer";
import { AiOutlineCamera } from "react-icons/ai";
import { useNavigate } from "react-router-dom";

const GuestProfile = () => {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  console.log("Current user:", user);

  // 🟢 Upload image to Cloudinary
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "kubo_unsigned"); // your preset name

    const res = await fetch(`https://api.cloudinary.com/v1_1/dujq9wwzf/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Upload failed");
    return data.secure_url;
  };

  // 🟢 Listen for auth changes (so user persists after refresh)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setUser({ id: currentUser.uid, ...data });
          setFullName(data.name || data.fullName || "");
          setEmail(data.email || "");
          setProfilePic(data.profilePic || "");
        }
      } else {
        setUser(null);
        setFullName("");
        setEmail("");
        setProfilePic("");
      }
    });

    return () => unsubscribe();
  }, []);

  // 🟢 Preview new profile picture before upload
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

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      if (!auth.currentUser) return alert("No user found!");

      const userRef = doc(db, "users", auth.currentUser.uid);
      let updatedData = { fullName };

      // 🟢 Resize image before uploading (to stay under 10MB)
      const resizeImage = (file, maxWidth = 800, maxHeight = 800) => {
        return new Promise((resolve) => {
          const img = document.createElement("img");
          const reader = new FileReader();
          reader.onload = (e) => {
            img.src = e.target.result;
          };
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > maxWidth) {
                height = Math.round((height *= maxWidth / width));
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = Math.round((width *= maxHeight / height));
                height = maxHeight;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => resolve(blob),
              "image/jpeg",
              0.8 // quality 80%
            );
          };
          reader.readAsDataURL(file);
        });
      };

      // 🟢 Upload new profile picture if selected
      if (newProfilePic) {
        console.log("Resizing image before upload...");
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
      console.error("Error updating profile:", err);
      alert("Failed to update profile. Try again.");
    }
    setLoading(false);
  };

  // 🟢 Logout Function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Logged out successfully!");
      navigate("/login");
    } catch (error) {
      alert("Error logging out: " + error.message);
    }
  };

  return (
    <>
      <Navbar />
      <div className="pt-20 pb-10 px-5 md:px-10 lg:px-20 bg-olive-light min-h-screen relative">
        <h1 className="text-3xl font-bold text-olive-dark mb-8 text-center md:text-left">
          Guest Profile
        </h1>

        <div className="bg-beige rounded-2xl shadow-md p-8 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Profile Picture */}
          <div className="flex flex-col items-center md:items-start">
            <div className="relative w-40 h-40 mb-4">
              <img
                src={preview || profilePic || "/default-profile.png"}
                alt="Profile"
                className="w-40 h-40 rounded-full object-cover border-2 border-olive-dark"
              />
              <label className="absolute bottom-0 right-0 bg-olive-dark p-2 rounded-full cursor-pointer hover:opacity-90">
                <AiOutlineCamera className="text-white text-xl" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePicChange}
                />
              </label>
            </div>
            {newProfilePic && (
              <p className="text-sm text-gray-600">
                New picture ready to upload
              </p>
            )}
          </div>

          {/* Profile Details */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-olive-dark"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 cursor-not-allowed"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={loading}
              className="bg-olive-dark text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* 🟢 Logout Button (bottom-right) */}
        <button
          onClick={handleLogout}
          className="fixed bottom-5 right-5 bg-red-600 text-white px-5 py-2 rounded-full shadow-lg hover:bg-red-700 transition-all"
        >
          Logout
        </button>
      </div>
      <Footer />
    </>
  );
};

export default GuestProfile;
