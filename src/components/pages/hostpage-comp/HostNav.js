import React from 'react'
import { useState, useRef, useEffect } from 'react'

const HostNav = () => {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

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

  return (
    <div className="fixed top-0 w-full h-16 bg-white/40 backdrop-blur-md border-b border-white/30 flex items-center justify-between px-10 z-50 shadow-md">
      {/* Logo */}
      <h1 className="text-2xl font-bold text-olive-dark tracking-tight">
        KuboHub <span className="font-light opacity-70">Host</span>
      </h1>

      {/* Right Section */}
      <div className="flex items-center gap-x-4">
        <button className="bg-olive text-white font-medium px-5 py-2 rounded-xl hover:bg-olive-dark transition duration-300">
          Add New Listing
        </button>

        <img
          src="https://randomuser.me/api/portraits/women/44.jpg"
          alt="Host Profile"
          className="w-10 h-10 rounded-full border-2 border-white/60 shadow"
          onClick={() => setOpen(!open)}
        />

        {open && (
          <div className="absolute top-14 right-0 bg-white backdrop-blur-md border border-white/40 rounded-xl shadow-lg py-2 w-40 flex flex-col text-olive-dark text-sm animate-fade-in">
            <button className="px-4 py-2 text-left hover:bg-olive/40 transition">View Profile</button>
            <button className="px-4 py-2 text-left hover:bg-olive/40 transition">Logout</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default HostNav
