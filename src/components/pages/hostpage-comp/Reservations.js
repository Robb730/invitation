import React from "react";

const Reservations = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 w-full">
      <h2 className="text-xl font-semibold text-olive-dark mb-4">
        Reservations
      </h2>
      <p className="text-gray-600 mb-6">
        You’ll see all guest bookings here once your listings receive reservations.
      </p>

      <div className="border border-gray-200 rounded-xl p-4 text-center text-gray-500">
        No reservations yet.
      </div>
    </div>
  );
};

export default Reservations;
