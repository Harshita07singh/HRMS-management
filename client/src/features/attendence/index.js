import React, { useState, useEffect } from "react";
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [role] = useState(localStorage.getItem("role"));
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [message, setMessage] = useState("");
  const [onBreak, setOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(null);

  // Filters (Admin)
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDate, setSearchDate] = useState("");

  // Popup states
  const [showModal, setShowModal] = useState(false);
  const [selectedBreaks, setSelectedBreaks] = useState([]);
  const [selectedTotalBreak, setSelectedTotalBreak] = useState(0);

  const getDuration = (punchIn, punchOut) => {
    if (!punchIn || !punchOut) return "—";
    const diffMs = new Date(punchOut) - new Date(punchIn);
    if (diffMs <= 0) return "—";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);

      let url = "";
      if (role === "Admin" || role === "Project Manager") {
        url = `/attendance?month=${month}&year=${year}`;
        if (searchDate) url += `&date=${searchDate}`;
        if (searchTerm) url += `&search=${searchTerm}`;
      } else {
        url = `/attendance/my`;
      }

      const res = await API.get(url);
      setAttendance(res.data);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Failed to fetch attendance");
    } finally {
      setLoading(false);
    }
  };

  const handlePunchIn = async () => {
    try {
      const res = await API.post("/attendance/punch-in");
      setMessage(res.data.message);
      fetchAttendance();
    } catch (err) {
      setMessage(err.response?.data?.message || "Punch-in failed");
    }
  };

  const handlePunchOut = async () => {
    try {
      const res = await API.post("/attendance/punch-out");
      setMessage(res.data.message);
      fetchAttendance();
    } catch (err) {
      setMessage(err.response?.data?.message || "Punch-out failed");
    }
  };

  // Start / End break logic
  const handleBreakToggle = async () => {
    const now = new Date();
    if (now.getHours() >= 18) {
      setMessage("Breaks cannot be started after 6 PM");
      return;
    }

    try {
      if (!onBreak) {
        setBreakStartTime(now);
        setOnBreak(true);
        setMessage("Break started...");
      } else {
        const res = await API.post("/attendance/add-break", {
          start: breakStartTime,
          end: now,
        });
        setOnBreak(false);
        setBreakStartTime(null);
        setMessage(res.data.message);
        fetchAttendance();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to record break");
    }
  };

  const handleShowBreaks = (breaks) => {
    const total = breaks?.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
    setSelectedBreaks(breaks);
    setSelectedTotalBreak(total);
    setShowModal(true);
  };

  useEffect(() => {
    fetchAttendance();
  }, [month, year, searchTerm, searchDate]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Attendance Dashboard
      </h2>

      {/* ✅ Filters for Admin/PM */}
      {(role === "Admin" || role === "Project Manager") && (
        <div className="bg-white shadow rounded-lg p-4 mb-6 flex flex-wrap justify-between items-center gap-4">
          <input
            type="text"
            placeholder="Search by Name or Email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-lg px-3 py-2 w-1/3"
          />
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="border rounded-lg px-3 py-2"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="border rounded-lg px-3 py-2"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            onClick={fetchAttendance}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      )}

      {/* Punch Buttons */}
      {role !== "Admin" && role !== "Project Manager" && (
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={handlePunchIn}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Punch In
          </button>
          <button
            onClick={handlePunchOut}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Punch Out
          </button>
          <button
            onClick={handleBreakToggle}
            className={`${
              onBreak ? "bg-yellow-700" : "bg-yellow-500 hover:bg-yellow-600"
            } text-white px-4 py-2 rounded-lg`}
          >
            {onBreak ? "End Break" : "Start Break"}
          </button>
        </div>
      )}

      {/* Message */}
      {message && (
        <p className="text-center text-blue-600 mb-4 font-medium">{message}</p>
      )}

      {/* Attendance Table */}
      <div className="overflow-x-auto">
        <table className="table-auto w-full bg-white shadow rounded-lg">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              {(role === "Admin" || role === "Project Manager") && (
                <>
                  <th className="px-4 py-2">Employee</th>
                  <th className="px-4 py-2">Email</th>
                </>
              )}
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Punch In</th>
              <th className="px-4 py-2">Punch Out</th>
              <th className="px-4 py-2">Duration</th>
              <th className="px-4 py-2">Break Info</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.length > 0 ? (
              attendance.map((att, i) => (
                <tr key={i} className="text-center border-b">
                  {(role === "Admin" || role === "Project Manager") && (
                    <>
                      <td className="px-4 py-2">
                        {att.employeeId?.fullname ||
                          att.employeeId?.name ||
                          "—"}
                      </td>
                      <td className="px-4 py-2">
                        {att.employeeId?.email || "—"}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-2">
                    {new Date(att.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    {att.punchIn
                      ? new Date(att.punchIn).toLocaleTimeString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {att.punchOut
                      ? new Date(att.punchOut).toLocaleTimeString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {getDuration(att.punchIn, att.punchOut)}
                  </td>
                  <td className="px-4 py-2">
                    {att.breaks?.length > 0 ? (
                      <button
                        onClick={() => handleShowBreaks(att.breaks)}
                        className="text-yellow-600 hover:text-yellow-800 font-semibold"
                      >
                        View Breaks
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td
                    className={`px-4 py-2 font-semibold ${
                      att.attendanceDay === "Present"
                        ? "text-green-600"
                        : att.attendanceDay === "Leave"
                        ? "text-blue-600"
                        : "text-red-600"
                    }`}
                  >
                    {att.attendanceDay}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={
                    role === "Admin" || role === "Project Manager" ? 8 : 6
                  }
                  className="text-center py-6 text-gray-500"
                >
                  No attendance records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Breaks Popup Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-96">
            <h3 className="text-xl font-semibold mb-4 text-center">
              Break Details
            </h3>
            <div className="max-h-60 overflow-y-auto">
              {selectedBreaks.map((br, i) => (
                <div key={i} className="border-b py-2">
                  <p>
                    <strong>
                      {new Date(br.start).toLocaleTimeString()} -{" "}
                      {new Date(br.end).toLocaleTimeString()}
                    </strong>
                  </p>
                  <p>Duration: {br.durationMinutes} min</p>
                </div>
              ))}
            </div>

            {/* ✅ Show total + extended info */}
            <div className="mt-4 text-center">
              <p className="font-semibold">
                Total Break Time: {selectedTotalBreak} min
              </p>
              {selectedTotalBreak > 60 && (
                <p className="text-red-600 font-semibold">
                  Extended by {selectedTotalBreak - 60} min
                </p>
              )}
            </div>

            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
