import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebaseConfig'; // adjust path if needed

const Navbar = ({ user }) => {
  const navigate = useNavigate();

  const handleAuthClick = async () => {
    if (user) {
      try {
        await signOut(auth);
        alert("Logged out successfully!");
        navigate('/'); // return to homepage after logout
      } catch (error) {
        alert(error.message);
      }
    } else {
      navigate('/login'); // go to login page
    }
  };

  return (
    <div className='bg-olive-dark h-16 flex items-center px-10 gap-x-3 fixed top-0 w-full z-10 shadow-md'>
      <h1 className='text-beige text-2xl font-bold'>KuboHub</h1>

      <div className='flex items-center ml-auto gap-x-4'>
        <button className='font-semibold text-beige px-4 py-2 rounded hover:bg-grayish duration-300'>Homes</button>   
        <button className='font-semibold text-beige px-4 py-2 rounded hover:bg-grayish duration-300'>Experiences</button>
        <button className='font-semibold text-beige px-4 py-2 rounded hover:bg-grayish duration-300'>Services</button> 

        <div className='ml-6 flex items-center gap-x-5'>
          <button className='font-semibold bg-beige text-charcoal px-6 py-2 rounded hover:bg-grayish hover:text-beige duration-700'>
            <Link to ="/becomehost">Be a Host</Link>
            
          </button>

          <button
            onClick={handleAuthClick}
            className='font-semibold bg-beige text-charcoal px-4 py-2 rounded hover:bg-grayish hover:text-beige duration-700'
          >
            {user ? 'Logout' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
