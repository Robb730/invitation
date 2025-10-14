import React from 'react'

const Dashboard = () => {
  return (
    <div>
      <div className='ml-60 pt-16 px-10'>
        <h1 className='text-3xl font-normal mt-10'>Welcome Back, Host</h1>

        {/* switch from grid to flex and reduce gap so cards sit close together */}
        <div className='mt-6 flex flex-row gap-10 items-center justify-center'>
          <div className='bg-olive-dark text-beige rounded-lg shadow-md p-6 flex flex-col w-52'>
            <span className='text-3xl font-bold'>3</span>
            <span className='text-sm mt-2 text-amber-100'>Total Listings</span>
          </div>

          <div className='bg-olive-dark text-beige rounded-lg shadow-md p-6 flex flex-col w-52'>
            <span className='text-3xl font-bold'>128</span>
            <span className='text-sm mt-2 text-amber-100'>Total Bookings</span>
          </div>

          <div className='bg-olive-dark text-beige rounded-lg shadow-md p-6 flex flex-col w-52'>
            <span className='text-3xl font-bold'>4.9</span>
            <span className='text-sm mt-2 text-amber-100'>Average Rating</span>
          </div>

          <div className='bg-olive-dark text-beige rounded-lg shadow-md p-6 flex flex-col w-52'>
            <span className='text-3xl font-bold'>₱54,200</span>
            <span className='text-sm mt-2 text-amber-100'>Earnings (This month)</span>
          </div>
        </div>
        <div className='mt-10'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-2xl font-semibold'>My Listings</h2>
              <p className='text-sm text-gray-500 mt-1'>Manage your active properties</p>
            </div>

            <p className='text-sm text-olive-dark font-medium cursor-pointer hover:underline'>
              View listings
            </p>
          </div>
          
          <div className='mt-6 flex flex-row gap-10 items-left justify-start'>
            <div className='bg-olive-dark text-beige rounded-lg shadow-md p-6 flex flex-col w-52 h-32'>
              <span className='text-2xl font-bold'>Listing 1</span>
              <span className='text-sm mt-2 text-amber-100'>Location: City A</span>
            </div>
            <div className='bg-olive-dark text-beige rounded-lg shadow-md p-6 flex flex-col w-52 h-32'>
              <span className='text-2xl font-bold'>Listing 1</span>
              <span className='text-sm mt-2 text-amber-100'>Location: City A</span>
            </div>
            <div className='bg-olive-dark text-beige rounded-lg shadow-md p-6 flex flex-col w-52 h-32'>
              <span className='text-2xl font-bold'>Listing 1</span>
              <span className='text-sm mt-2 text-amber-100'>Location: City A</span>
            </div>
            <div className='bg-olive-dark text-beige rounded-lg shadow-md p-6 flex flex-col w-52 h-32'>
              <span className='text-2xl font-bold'>Listing 1</span>
              <span className='text-sm mt-2 text-amber-100'>Location: City A</span>
            </div>
            <div className='bg-olive-dark text-beige rounded-lg shadow-md p-6 flex flex-col w-52 h-32'>
              <span className='text-2xl font-bold'>Listing 1</span>
              <span className='text-sm mt-2 text-amber-100'>Location: City A</span>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
