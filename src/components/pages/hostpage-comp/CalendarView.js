import React, { useState, useMemo } from "react";
import { Calendar, X } from "lucide-react";
import { ChevronLeft, ChevronRight, Sparkles, Wrench } from "lucide-react";
import { FaHome } from "react-icons/fa";

// -----------------------------------------------------
// 1. Utility: Generate calendar matrix for a given month
// -----------------------------------------------------
const generateCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days = [];
  const startIndex = firstDay.getDay(); // Sunday = 0

  // Leading empty cells
  for (let i = 0; i < startIndex; i++) days.push(null);

  // Actual dates
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  // Trailing empty cells to complete the 7-column grid
  while (days.length % 7 !== 0) days.push(null);

  return days;
};

// -----------------------------------------------------
// 2. Category badges/colors/icons
// -----------------------------------------------------

const getCategoryIcon = (category) => {
  switch (category) {
    case "experience":
      return Sparkles;
    case "service":
      return Wrench;
    default:
      return FaHome;
  }
};

const getCategoryColor = (category) => {
  switch (category) {
    case "experience":
      return "bg-purple-100 border-purple-300 text-purple-800";
    case "service":
      return "bg-orange-100 border-orange-300 text-orange-800";
    default:
      return "bg-blue-100 border-blue-300 text-blue-800";
  }
};

// -----------------------------------------------------
// 3. Convert Firestore reservations into a map by date
// -----------------------------------------------------
const groupBookingsByDate = (reservations) => {
  const map = {};

  reservations.forEach((r) => {
    // Ensure consistent parsing of checkIn/checkOut as local dates
    const parseLocalDate = (dateStr) => {
      const parts = new Date(dateStr).toString().split(" ");
      // Example: ["Wed", "Nov", "19", "2025", "00:00:00", "GMT+0800", "(Philippine", "Standard", "Time)"]
      const month = new Date(dateStr).getMonth();
      const day = parseInt(parts[2]);
      const year = parseInt(parts[3]);
      return new Date(year, month, day);
    };

    const startDate = parseLocalDate(r.checkIn || r.bookedDate);
    const endDate = r.checkOut ? parseLocalDate(r.checkOut) : startDate;

    let current = new Date(startDate);

    while (current <= endDate) {
      const key = current.toISOString().split("T")[0];
      if (!map[key]) map[key] = [];
      map[key].push(r);
      current.setDate(current.getDate() + 1);
    }
  });

  return map;
};

// -----------------------------------------------------
// 4. MAIN COMPONENT
// -----------------------------------------------------
const CalendarView = ({ reservations, onClose, listingsMap }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const calendarDays = useMemo(
    () => generateCalendarDays(currentYear, currentMonth),
    [currentMonth, currentYear]
  );

  const bookingsMap = useMemo(
    () => groupBookingsByDate(reservations),
    [reservations]
  );

  const getBookingsForDate = (date) => {
    if (!date) return [];
    const key = date.toISOString().split("T")[0];
    return bookingsMap[key] || [];
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentYear, currentMonth + offset, 1);
    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[92vh] overflow-hidden flex flex-col animate-in">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-xl shadow-sm">
              <Calendar className="text-emerald-600" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Reservation Calendar
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">
                Manage your bookings and availability
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="hover:bg-white/80 rounded-xl p-2.5 transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Close calendar"
          >
            <X size={22} className="text-gray-700" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-white border-gray-100">
          <button
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95"
            onClick={() => changeMonth(-1)}
          >
            <ChevronLeft size={18} />
            Previous
          </button>

          <h3 className="text-xl font-bold text-gray-800">
            {new Date(currentYear, currentMonth).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h3>

          <button
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95"
            onClick={() => changeMonth(1)}
          >
            Next
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Calendar */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {/* Day Names */}
            <div className="grid grid-cols-7 mb-2 rounded-xl overflow-hidden shadow-sm">
              {[
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ].map((day) => (
                <div
                  key={day}
                  className="p-3 text-center font-bold text-gray-700 bg-gradient-to-b from-white to-gray-50 text-sm border-r border-gray-100 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Month Grid */}
            <div className="grid grid-cols-7 bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200">
              {calendarDays.map((date, idx) => {
                const dayBookings = getBookingsForDate(date);
                const isToday =
                  date && date.toDateString() === today.toDateString();
                const isPast = date && date < today && !isToday;

                return (
                  <div
                    key={idx}
                    className={`
                      min-h-[140px] border-r border-b border-gray-100 p-3 relative transition-all duration-200
                      ${date ? "bg-white hover:bg-gray-50" : "bg-gray-50"}
                      ${
                        isToday
                          ? "bg-gradient-to-br from-emerald-50 to-blue-50 ring-2 ring-emerald-400 ring-inset"
                          : ""
                      }
                      ${isPast ? "opacity-50" : ""}
                      last:border-r-0
                    `}
                  >
                    {date && (
                      <>
                        {/* Date Number */}
                        <div className="flex items-center justify-between mb-2.5">
                          <span
                            className={`
                              text-sm font-bold
                              ${
                                isToday
                                  ? "text-emerald-700 bg-emerald-100 w-7 h-7 rounded-full flex items-center justify-center"
                                  : isPast
                                  ? "text-gray-400"
                                  : "text-gray-800"
                              }
                            `}
                          >
                            {date.getDate()}
                          </span>
                          {dayBookings.length > 0 && (
                            <span className="text-xs font-bold bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-2 py-1 rounded-full shadow-sm">
                              {dayBookings.length}
                            </span>
                          )}
                        </div>

                        {/* Bookings */}
                        <div className="space-y-1.5">
                          {dayBookings.slice(0, 3).map((booking, i) => {
                            const rawCategory =
                              booking.listingCategory?.toLowerCase() || "";
                            let category = "home";

                            if (rawCategory.includes("home")) category = "home";
                            else if (rawCategory.includes("experience"))
                              category = "experience";
                            else if (rawCategory.includes("service"))
                              category = "service";

                            const CategoryIcon = getCategoryIcon(category);

                            return (
                              <div
                                key={i}
                                className={`text-xs px-2.5 py-2 rounded-lg border-l-3 truncate shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 ${getCategoryColor(
                                  category
                                )}`}
                                title={`${booking.guestName} - ${booking.listingTitle}`}
                              >
                                <div className="flex items-center gap-2">
                                  <CategoryIcon className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate font-medium">
                                    {booking.guestName || "Guest"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                          {dayBookings.length > 3 && (
                            <div className="text-xs text-gray-600 font-semibold px-2.5 py-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg shadow-sm">
                              +{dayBookings.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mx-6 mb-6 p-5 bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-bold text-gray-800 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-blue-500 rounded-full"></div>
                Categories:
              </span>

              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 rounded-lg border border-blue-300 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105">
                <FaHome className="w-3.5 h-3.5" />
                <span className="font-semibold">Home</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 rounded-lg border border-purple-300 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-semibold">Experience</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-orange-50 to-orange-100 text-orange-700 rounded-lg border border-orange-300 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105">
                <Wrench className="w-3.5 h-3.5" />
                <span className="font-semibold">Service</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
