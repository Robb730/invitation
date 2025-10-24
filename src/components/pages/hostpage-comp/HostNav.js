import React, { useState, useRef, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth, db } from "../../../firebaseConfig"
import { useNavigate } from 'react-router-dom'
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp
} from 'firebase/firestore'

const HostNav = ({ user }) => {
  const [open, setOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const [fullname, setFullName] = useState("")
  const [profile, setProfile] = useState("")

  // Modal form states
  const [title, setTitle] = useState("")
  const [location, setLocation] = useState("")
  const [category, setCategory] = useState("")
  const [price, setPrice] = useState("")
  const [description, setDescription] = useState("")
  const [images, setImages] = useState([]) // for storing selected files
  const [uploading, setUploading] = useState(false)

  const [promoCode, setPromoCode] = useState("")
  const [discount, setDiscount] = useState("")

  // Fetch user info
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            const data = docSnap.data()
            setFullName(data.fullName)
            setProfile(data.profilePic)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      }
    }
    fetchUserData()
  }, [user])

  // Upload image to ImgBB and return its URL
const uploadToImgBB = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=88b38e6e8b2d5e82051bee9b7b4e837a`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Upload failed");
  return data.data.url; // the public URL of the uploaded image
};


  const handleAuthClick = async () => {
    if (user) {
      try {
        await signOut(auth)
        alert("Logged out successfully!")
        navigate('/')
      } catch (error) {
        alert(error.message)
      }
    } else {
      navigate('/login')
    }
  }

  // Convert selected images to base64
  

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSaveDraft = async (e) => {
    e.preventDefault()
    if (!user) return alert("You must be logged in.")

    if (images.length === 0) {
      return alert("Please add at least one image.")
    }

    if (images.length > 4) {
      return alert("You can upload a maximum of 4 images.")
    }

    try {
      
      const uploadedURLs = await Promise.all(images.map(img => uploadToImgBB(img)))
      const status = "Draft"

      await addDoc(collection(db, "listings"), {
        title,
        location,
        category,
        status,
        price,
        description,
        images: uploadedURLs,
        promoCode: promoCode || null,
        discount: discount ? parseFloat(discount) : null,
        createdAt: serverTimestamp(),
        hostId: user.uid,
      })

      alert("Listing saved as draft!")
      setShowModal(false)
      setTitle("")
      setLocation("")
      setPrice("")
      setCategory("")
      setDescription("")
      setImages([])
    } catch (err) {
      alert("Error adding listing: " + err.message)
    } finally {
      setUploading(false)
    }
  }

  // Handle new listing
  const handleAddListing = async (e) => {
    e.preventDefault()
    if (!user) return alert("You must be logged in.")

    if (images.length === 0) {
      return alert("Please add at least one image.")
    }

    if (images.length > 4) {
      return alert("You can upload a maximum of 4 images.")
    }

    try {
      setUploading(true)
      const uploadedURLs = await Promise.all(images.map(img => uploadToImgBB(img)))
      const status = "Active"

      await addDoc(collection(db, "listings"), {
        title,
  location,
  category,
  status,
  price,
  description,
  images: uploadedURLs,
  promoCode: promoCode || null,
  discount: discount ? parseFloat(discount) : null,
  createdAt: serverTimestamp(),
  hostId: user.uid,
      })

      alert("Listing added successfully!")
      setShowModal(false)
      setTitle("")
      setLocation("")
      setPrice("")
      setCategory("")
      setDescription("")
      setImages([])
    } catch (err) {
      alert("Error adding listing: " + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      {/* Navbar */}
      <div className="fixed top-0 w-full h-16 bg-white/40 backdrop-blur-md border-b border-white/30 flex items-center justify-between px-10 z-50 shadow-md">
        <h1 className="text-2xl font-bold text-olive-dark tracking-tight">
          KuboHub <span className="font-light opacity-70">Host</span>
        </h1>

        <div className="flex items-center gap-x-4">
          <button
            onClick={() => setShowModal(true)}
            className="bg-olive text-white font-medium px-5 py-2 rounded-xl hover:bg-olive-dark transition duration-300"
          >
            Add New Listing
          </button>

          <img
            src={profile || "https://via.placeholder.com/40"}
            alt="Host Profile"
            className="w-10 h-10 rounded-full border-2 border-white/60 shadow cursor-pointer"
            onClick={() => setOpen(!open)}
          />

          {open && (
            <div
              ref={menuRef}
              className="absolute top-14 right-0 bg-white backdrop-blur-md border border-white/40 rounded-xl shadow-lg py-2 w-auto flex flex-col text-olive-dark text-sm animate-fade-in"
            >
              <div className="px-4 py-2 text-left text-black text-sm">{fullname}</div>
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl w-[90%] max-w-md">
            <h2 className="text-2xl font-semibold text-olive-dark mb-4">Add New Listing</h2>

            <form onSubmit={handleAddListing} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Property Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                required
              />
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                required
              />
              <input
                type="number"
                placeholder="Price per night (₱)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                required
              />
              <input
              type="text"
              placeholder="Enter promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none w-full"
            />
            <input
            type="number"
            placeholder="Enter discount (e.g. 10 for 10%)"
            min="1"
            max="100"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none w-full"
          />
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-olive-dark outline-none"
                required
              />

              {/* Image upload input */}
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
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {Array.from(images).map((img, idx) => (
                    <img
                      key={idx}
                      src={URL.createObjectURL(img)}
                      alt="preview"
                      className="h-16 w-16 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button onClick = {handleSaveDraft} className = "px-5 py-2 rounded-lg text-white bg-olive-dark hover:bg-olive">
                  Save as draft
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className={`px-5 py-2 rounded-lg text-white transition ${
                    uploading ? "bg-gray-500 cursor-not-allowed" : "bg-olive-dark hover:bg-olive"
                  }`}
                >
                  {uploading ? "Uploading..." : "Save Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default HostNav
