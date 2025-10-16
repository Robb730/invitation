import React from 'react'
import bgImage from './images/bgImage.png';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig'; // adjust path if needed


const Search = ({user}) => {
  
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
    <div className='flex justify-center items-center mt-16'>
      <div
        className='bg-cover bg-center p-10  shadow-2xl w-full h-96 mt-0 opacity-70 flex items-center justify-center'
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className=' p-6 rounded-lg text-center items-center'>
          <h2 className='text-white text-4xl font-bold'>Welcome Home<span className='text-olive-darker'>{user ? `, ${userName}` : ''}</span></h2>
          <p className='text-white mt-3'>Find unique stays and experiences around</p>
          {user ? <button className='rounded-lg mt-3 mb-1 p-2 shadow-md bg-white/12 backdrop-blur-sm border border-white/30 text-white font-semibold  hover:bg-olive/40 duration-700'>View previous bookings</button> : ''}
          <div className='flex justify-center gap-3'>
            <input
            type='text'
            placeholder='Search for location'
            className='mt-5 p-2 w-80 shadow-xl bg-white/40 text-white placeholder:text-gray-600 text-start pl-5 rounded-full focus:outline-white/30 backdrop-blur-sm border border-white/30'
          />
          <button className='bg-white/12 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-lg p-2 w-32 mt-5 hover:bg-olive/40 duration-700'>
            Search
          </button>
          </div>
          
        </div>
      </div>
    </div>
  )
}

export default Search
