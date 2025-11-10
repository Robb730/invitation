// CalendarView.js
import React, { useState, useMemo } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, X } from "lucide-react";

// Setup date-fns localizer
const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

const CalendarView = ({ reservations, onClose }) => {
  const [view, setView] = useState("month");
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Convert reservations to calendar events
  const events = useMemo(
    () =>
      reservations.map((r) => ({
        id: r.id,
        title: `${r.listingTitle} (${r.guestName || "Guest"})`,
        start: new Date(r.checkIn),
        end: new Date(r.checkOut),
        status: r.status,
      })),
    [reservations]
  );

  const eventStyleGetter = (event) => {
    let borderColor = "#6B8E23";
    switch (event.status) {
      case "Completed":
        borderColor = "#3B82F6";
        break;
      case "Cancelled":
        borderColor = "#EF4444";
        break;
      case "Confirmed":
        borderColor = "#22C55E";
        break;
      default:
        borderColor = "#6B8E23";
    }
    return {
      style: {
        borderLeft: `5px solid ${borderColor}`,
        backgroundColor: "#f9fafb",
        color: "#111827",
        borderRadius: "6px",
        padding: "6px 10px",
        fontWeight: 500,
        fontSize: "0.875rem",
        cursor: "pointer",
        transition: "all 0.1s ease",
      },
    };
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <Calendar size={22} /> Reservation Calendar
          </h2>
          <button
            onClick={onClose}
            className="hover:bg-gray-100 rounded-full p-2 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex gap-2 px-6 py-3 border-b border-gray-200">
          {["month", "week", "day"].map((v) => (
            <button
              key={v}
              className={`px-4 py-1 rounded-full text-sm font-medium transition ${
                view === v
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setView(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* Calendar */}
        <div className="flex-1 p-6 bg-gray-50">
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            views={["month", "week", "day"]}
            eventPropGetter={eventStyleGetter}
            style={{ height: "100%", borderRadius: "12px", background: "white" }}
            onSelectEvent={(event) => setSelectedEvent(event)}
          />
        </div>

        {/* Event Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
              <h3 className="text-xl font-bold mb-2">{selectedEvent.title}</h3>
              <p className="text-gray-600 mb-1">
                <strong>Status:</strong> {selectedEvent.status}
              </p>
              <p className="text-gray-600 mb-1">
                <strong>Check-in:</strong>{" "}
                {selectedEvent.start.toLocaleDateString()}
              </p>
              <p className="text-gray-600">
                <strong>Check-out:</strong>{" "}
                {selectedEvent.end.toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
