import React, { useEffect, useState } from 'react';
import bgVid from './images/homepage_vid.mp4';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig'; // adjust path if needed

const Search = ({ user }) => {
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setFullName(data.name || 'Guest');
          } else {
            console.log('No user data found in Firestore');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const userName = fullName || 'Guest';
  

  return (
    <div className="flex justify-center items-center mt-16 relative w-full h-[24rem] sm:h-[28rem] md:h-[30rem] overflow-hidden z-0">

      {/* 🔹 Background Video */}
      <video
        src={bgVid}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-80"
      />

      {/* 🔹 Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* 🔹 Foreground content */}
      <div className="relative z-10 p-4 sm:p-6 text-center items-center max-w-xl w-full">
        <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold leading-snug">
          Welcome Home
          <span className="text-olive">
            {user ? `, ${userName}` : ''}
          </span>
        </h2>

        <p className="text-white mt-3 text-sm sm:text-base md:text-lg">
          Find unique stays and experiences around
        </p>

        {user && (
          <button className="rounded-lg mt-4 mb-1 px-4 py-2 shadow-md bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold hover:bg-olive/40 duration-700 text-sm sm:text-base">
            View previous bookings
          </button>
        )}

        {/* 🔹 Search bar */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-5 w-full px-4">
          <input
            type="text"
            placeholder="Search for location"
            className="p-2 sm:p-3 w-full sm:w-80 shadow-xl bg-white/40 text-white placeholder:text-white text-start pl-5 rounded-full focus:outline-white/30 backdrop-blur-sm border border-white/30 text-sm sm:text-base"
          />
          <button className="bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-lg px-4 py-2 sm:px-5 sm:py-2 w-full sm:w-32 hover:bg-olive/40 duration-700 text-sm sm:text-base">
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

export default Search;
