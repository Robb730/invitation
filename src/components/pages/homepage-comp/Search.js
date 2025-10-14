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
        className='bg-cover bg-center p-10 rounded-3xl shadow-2xl w-11/12 h-96 mt-10 opacity-70 flex items-center justify-center'
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className='bg-black bg-opacity-50 p-6 rounded-lg text-center items-center'>
          <h2 className='text-beige text-4xl font-bold'>Welcome Home<span className='text-olive'>{user ? `, ${userName}` : ''}</span></h2>
          <p className='text-amber-100 mt-3'>Find unique stays and experiences around</p>
          {user ? <button className='bg-olive-dark rounded-lg mt-3 mb-5 p-2 text-beige'>View previous bookings</button> : ''}
          <div className='flex justify-center gap-3'>
            <input
            type='text'
            placeholder='Search for location'
            className='mt-5 p-2 w-64 text-center rounded-full'
          />
          <button className='bg-olive-dark text-beige font-semibold rounded-lg p-2 w-32 mt-5 hover:bg-olive duration-700'>
            Search
          </button>
          </div>
          
        </div>
      </div>
    </div>
  )
}

export default Search
