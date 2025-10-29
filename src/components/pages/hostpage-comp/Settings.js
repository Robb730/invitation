import React from "react";

const Settings = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 w-full">
      <h2 className="text-xl font-semibold text-olive-dark mb-4">Settings</h2>
      <p className="text-gray-600 mb-6">
        Manage your profile, contact info, and hosting preferences.
      </p>

      <form className="space-y-4 max-w-md mx-auto">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Full Name</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-olive"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Email</label>
          <input
            type="email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-olive"
            placeholder="host@example.com"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Phone</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-olive"
            placeholder="+63 900 000 0000"
          />
        </div>
        <button
          type="submit"
          className="bg-olive text-white font-medium px-6 py-2 rounded-lg hover:bg-olive-dark transition-all"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default Settings;
