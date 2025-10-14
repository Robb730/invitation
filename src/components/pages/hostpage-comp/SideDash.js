import React from 'react'


const SideDash = () => {
  const menuItems = [
    { label: 'Dashboard'},
    { label: 'My Listings'},
    { label: 'Reservations'},
    { label: 'Messages'},
    { label: 'Earnings'},
    { label: 'Settings'},
    { label: 'Log Out'}
  ]

  return (
    <div className="fixed top-16 left-0 h-screen w-64 bg-olive text-white flex flex-col py-10 px-6 shadow-lg">
      <nav className="flex flex-col gap-y-3">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            className="flex items-center gap-x-3 px-4 py-2 rounded-lg hover:bg-white/15 transition duration-200 font-medium text-sm"
          >
            
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default SideDash
