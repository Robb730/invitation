import React from 'react'

const HostNav = () => {
  return (
    <div>
      <div className='bg-olive-dark h-16 flex items-center px-10 gap-x-3 fixed top-0 w-full z-10 shadow-sm'>
      <h1 className='text-beige text-2xl font-bold'>KuboHub <span className='font-thin'>Host</span></h1>

      <div className='flex items-center ml-auto gap-x-4'>
        

        <div className='ml-6 flex items-center gap-x-5'>
          

          <button
           
            className='font-semibold bg-beige text-charcoal px-4 py-2 rounded hover:bg-grayish hover:text-beige duration-700'
          >
            Profile
          </button>
        </div>
      </div>
    </div>
    </div>
  )
}

export default HostNav
