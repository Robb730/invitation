import React from 'react'

const Dashboard = () => {
  const stats = [
    { value: '24', label: 'Total Bookings' },
    { value: '$2,340', label: 'Total Earnings' },
    { value: '5', label: 'Active Listings' },
    { value: '4.8', label: 'Reviews' },
  ]

  const listings = [
    { name: 'Modern Studio in Makati', status: 'Active' },
    { name: 'Cozy Villa in Tagaytay', status: 'Active' },
    { name: 'Urban Loft in BGC', status: 'Inactive' },
  ]

  return (
    <div className="ml-64 pt-24 px-10 bg-beige min-h-screen">
      {/* Header */}
      <h1 className="text-3xl font-semibold text-olive-dark mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-md border border-white/30 flex flex-col items-start text-olive-dark"
          >
            <span className="text-3xl font-bold">{stat.value}</span>
            <span className="text-sm opacity-80 mt-2">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Recent Reservations */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-olive-dark mb-4">Recent Reservations</h2>
        <table className="w-full bg-white/40 backdrop-blur-md border border-white/30 rounded-2xl overflow-hidden shadow-md">
          <thead className="bg-white/50 text-olive-dark text-sm font-semibold">
            <tr>
              <th className="py-3 px-4 text-left">Guest</th>
              <th className="py-3 px-4 text-left">Property</th>
              <th className="py-3 px-4 text-left">Check-In</th>
              <th className="py-3 px-4 text-left">Check-Out</th>
              <th className="py-3 px-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm text-olive-dark/90">
            <tr className="border-t border-white/30">
              <td className="py-3 px-4">Maria D.</td>
              <td className="py-3 px-4">Cozy Villa</td>
              <td className="py-3 px-4">Oct 12</td>
              <td className="py-3 px-4">Oct 14</td>
              <td className="py-3 px-4">
                <span className="bg-olive/20 text-olive-dark px-3 py-1 rounded-full text-xs font-medium">
                  Confirmed
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Listings */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-olive-dark mb-4">My Listings</h2>
        <div className="grid grid-cols-3 gap-6">
          {listings.map((listing, idx) => (
            <div
              key={idx}
              className="bg-white/40 backdrop-blur-md rounded-2xl p-4 shadow-md border border-white/30 text-olive-dark"
            >
              <img
                src={`https://source.unsplash.com/400x250/?apartment,interior,${idx}`}
                alt={listing.name}
                className="rounded-xl mb-3"
              />
              <h3 className="font-semibold text-lg">{listing.name}</h3>
              <div className="flex justify-between mt-2 text-sm">
                <span
                  className={`${
                    listing.status === 'Active'
                      ? 'bg-olive/20 text-olive-dark'
                      : 'bg-gray-200 text-gray-600'
                  } px-3 py-1 rounded-full font-medium`}
                >
                  {listing.status}
                </span>
                <button className="text-olive-dark/80 hover:underline font-medium">
                  View Bookings
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
