import React from 'react'

const SideDash = () => {
  return (
    <div>
      <div className='bg-olive-dark h-screen w-60 fixed top-16 left-0 flex flex-col items-start px-6 py-10 gap-y-6'>
        <button className='font-semibold bg-beige text-olive-dark px-4 py-2 rounded hover:bg-grayish hover:text-beige duration-700 w-full text-center'>Overview</button>
        <button className='font-semibold bg-beige text-olive-dark px-4 py-2 rounded hover:bg-grayish hover:text-beige duration-700 w-full text-center'>My Listings</ button>
        <button className='font-semibold bg-beige text-olive-dark px-4 py-2 rounded hover:bg-grayish hover:text-beige duration-700 w-full text-center'>Bookings</button>
        <button className='font-semibold bg-beige text-olive-dark px-4 py-2 rounded hover:bg-grayish hover:text-beige duration-700 w-full text-center'>Earnings</button>
        <button className='font-semibold bg-beige text-olive-dark px-4 py-2 rounded hover:bg-grayish hover:text-beige duration-700 w-full text-center'>Reviews</button>
        <button className='font-semibold bg-beige text-olive-dark px-4 py-2 rounded hover:bg-grayish hover:text-beige duration-700 w-full text-center'>Settings</button>
        <button className='font-semibold bg-beige text-olive-dark px-4 py-2 rounded hover:bg-grayish hover:text-beige duration-700 w-full text-center'>Add new Listing</button>
      </div>
    </div>
  )
}

export default SideDash
