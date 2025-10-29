import React from "react";

const Messages = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 w-full">
      <h2 className="text-xl font-semibold text-olive-dark mb-4">Messages</h2>
      <p className="text-gray-600 mb-6">
        Chat with guests who booked your listings. All message threads will appear here.
      </p>

      <div className="border border-gray-200 rounded-xl p-4 text-center text-gray-500">
        No messages yet.
      </div>
    </div>
  );
};

export default Messages;
