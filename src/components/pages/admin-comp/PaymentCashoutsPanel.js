import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { cashoutApprovedOrDeclined } from "../../../utils/cashoutSystem";
import { CheckCircle, XCircle, Clock, Search } from "lucide-react";

const PaymentCashoutsPanel = () => {
  const [cashouts, setCashouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState(""); // ✅ Search state

  useEffect(() => {
    const fetchCashouts = async () => {
      try {
        const cashoutsRef = collection(db, "cashouts");
        const snapshot = await getDocs(cashoutsRef);

        const list = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const cashoutData = docSnap.data();

            let hostName = "Unknown Host";
            try {
              if (cashoutData.hostId && typeof cashoutData.hostId === "string") {
                const hostRef = doc(db, "users", cashoutData.hostId);
                const hostDoc = await getDoc(hostRef);
                if (hostDoc.exists()) {
                  const hostInfo = hostDoc.data();
                  hostName = hostInfo.fullName || hostInfo.name || "Unnamed Host";
                }
              } else {
                console.warn(`⚠️ Invalid hostId for cashout: ${docSnap.id}`, cashoutData.hostId);
              }
            } catch (err) {
              console.error("⚠️ Error fetching host info:", err);
              hostName = "Error Fetching Host";
            }

            return {
              id: docSnap.id,
              ...cashoutData,
              hostName,
            };
          })
        );

        // Sort by createdAt: earliest first
        list.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
          return dateA - dateB;
        });

        setCashouts(list);
      } catch (error) {
        console.error("❌ Error fetching cashouts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCashouts();
  }, []);

  const handleAction = async (cashoutId, status) => {
    const confirmAction = window.confirm(`Are you sure you want to ${status.toLowerCase()} this cashout?`);
    if (!confirmAction) return;

    setProcessingId(cashoutId);

    try {
      await cashoutApprovedOrDeclined(cashoutId, status);
      setCashouts((prev) =>
        prev.map((c) => (c.id === cashoutId ? { ...c, status, updatedAt: new Date() } : c))
      );
    } catch (err) {
      console.error("❌ Error processing cashout:", err);
      alert("Failed to process the cashout. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <p className="text-center mt-10">Loading cashouts...</p>;

  const statusOptions = ["All", "Pending", "Approved", "Declined"];

  // Filter by status first
  let displayedCashouts =
    filterStatus === "All" ? cashouts : cashouts.filter((c) => c.status === filterStatus);

  // ✅ Filter by search query
  if (searchQuery.trim()) {
    const queryLower = searchQuery.toLowerCase();
    displayedCashouts = displayedCashouts.filter(
      (c) =>
        c.hostName.toLowerCase().includes(queryLower) ||
        c.paypalEmail.toLowerCase().includes(queryLower) ||
        c.id.toLowerCase().includes(queryLower)
    );
  }

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50 rounded-3xl">
      <h1 className="text-xl sm:text-2xl font-bold text-olive-dark mb-4">💰 Cashout Requests</h1>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
              filterStatus === status
                ? "bg-olive-dark text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex items-center gap-2">
        <Search className="text-gray-500 flex-shrink-0" size={20} />
        <input
          type="text"
          placeholder="Search by Host Name, Email, or Cashout ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-olive-dark text-sm sm:text-base"
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto bg-white shadow-md rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="bg-olive-dark text-white">
            <tr>
              <th className="py-3 px-4 text-left">Cashout ID</th>
              <th className="py-3 px-4 text-left">Host Name</th>
              <th className="py-3 px-4 text-left">PayPal Email</th>
              <th className="py-3 px-4 text-center">Amount</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Requested At</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedCashouts.length > 0 ? (
              displayedCashouts.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-100 transition">
                  <td className="py-3 px-4 font-mono text-gray-700">{c.id}</td>
                  <td className="py-3 px-4 font-medium text-gray-800">{c.hostName}</td>
                  <td className="py-3 px-4">{c.paypalEmail}</td>
                  <td className="py-3 px-4 text-center font-semibold">
                    ₱{c.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        c.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : c.status === "Approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-600">
                    {c.createdAt?.toDate
                      ? c.createdAt.toDate().toLocaleString()
                      : new Date(c.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center flex justify-center gap-3">
                    {processingId === c.id ? (
                      <div className="text-gray-600 text-xs flex items-center gap-2">
                        <Clock size={14} /> Processing...
                      </div>
                    ) : c.status === "Pending" ? (
                      <>
                        <button
                          onClick={() => handleAction(c.id, "Approved")}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium"
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleAction(c.id, "Declined")}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium"
                        >
                          <XCircle size={14} /> Decline
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
                        <Clock size={14} /> Processed
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-5 text-center text-gray-500">
                  No cashout requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {displayedCashouts.length > 0 ? (
          displayedCashouts.map((c) => (
            <div key={c.id} className="bg-white shadow-md rounded-2xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-mono text-xs text-gray-500 mb-1">{c.id}</div>
                  <div className="font-medium text-gray-800 text-base">{c.hostName}</div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    c.status === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : c.status === "Approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {c.status}
                </span>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Email:</span>
                  <span className="text-gray-800 truncate ml-2">{c.paypalEmail}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-gray-800">₱{c.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Requested:</span>
                  <span className="text-gray-600 text-xs">
                    {c.createdAt?.toDate
                      ? c.createdAt.toDate().toLocaleString()
                      : new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t">
                {processingId === c.id ? (
                  <div className="text-gray-600 text-sm flex items-center justify-center gap-2">
                    <Clock size={16} /> Processing...
                  </div>
                ) : c.status === "Pending" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(c.id, "Approved")}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button
                      onClick={() => handleAction(c.id, "Declined")}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                    >
                      <XCircle size={16} /> Decline
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                    <Clock size={16} /> Processed
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white shadow-md rounded-2xl p-8 text-center text-gray-500">
            No cashout requests found.
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCashoutsPanel;
