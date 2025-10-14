import React from 'react'
import room1 from './images/sample-room-1.png';
import room2 from './images/sample-room-2.png';
import room3 from './images/sample-room-3.png';

const Pagination = ({onListingClick}) => {
  const listings = [
    { id: 1, title: "Charming Cottage" },
    { id: 2, title: "Beachfront Villa" },
    { id: 3, title: "City Apartment" },
  ];
  return (
    <div>
        <div className='flex items-center px-14 py-4'>
            <h1 className='text-xl font-semibold'>Popular</h1>

            <div className='ml-auto flex gap-2'>
            <button className='text-beige font-semibold bg-gray-400 rounded-full w-10 h-10 flex items-center justify-center'>&lt;</button>
            <button className='text-beige font-semibold bg-gray-400 rounded-full w-10 h-10 flex items-center justify-center'>&gt;</button>
            </div>
        </div>

      <div className='flex justify-center items-center mt-5 mb-10 gap-12'>

        <div className='relative bg-cover bg-center rounded-3xl shadow-2xl w-3/12 h-56 overflow-hidden hover:scale-110 duration-500' style={{ backgroundImage: `url(${room1})` }}>
          
          <div className='absolute inset-x-0 bottom-0'>
            <div className='bg-white bg-opacity-95 w-full p-3 flex items-start justify-between rounded-b-3xl'>
              <div className='flex flex-col'>
                <div className='text-sm font-semibold text-olive-dark'>Charming Cottage</div>
                <div className='text-xs text-gray-500 mt-1'>Cebu, Philippines</div>
                
              </div>
              <div>
                <div className='text-sm font-bold text-olive-dark'>P120</div>
                <button onClick={() => onListingClick(1)} className='bg-olive-dark p-1 rounded-full text-xs text-beige'>View Details</button>
              </div>
              
            </div>
          </div>

        </div>

        <div className='relative bg-cover bg-center rounded-3xl shadow-2xl w-3/12 h-56 overflow-hidden hover:scale-110 duration-500' style={{ backgroundImage: `url(${room2})` }}>
          
          <div className='absolute inset-x-0 bottom-0'>
            <div className='bg-white bg-opacity-95 w-full p-3 flex items-start justify-between rounded-b-3xl'>
              <div className='flex flex-col'>
                <div className='text-sm font-semibold text-olive-dark'>Bamboo Rest</div>
                <div className='text-xs text-gray-500 mt-1'>Bulacan, Philippines</div>
              </div>
              <div className='text-sm font-bold text-olive-dark'>P120</div>
            </div>
          </div>
          
        </div>

        <div className='relative bg-cover bg-center rounded-3xl shadow-2xl w-3/12 h-56 overflow-hidden hover:scale-110 duration-500' style={{ backgroundImage: `url(${room3})` }}>
          
          <div className='absolute inset-x-0 bottom-0'>
            <div className='bg-white bg-opacity-95 w-full p-3 flex items-start justify-between rounded-b-3xl'>
              <div className='flex flex-col'>
                <div className='text-sm font-semibold text-olive-dark'>Cloud 9 Loft</div>
                <div className='text-xs text-gray-500 mt-1'>Manila, Philippines</div>
              </div>
              <div className='text-sm font-bold text-olive-dark'>P120</div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}

export default Pagination
