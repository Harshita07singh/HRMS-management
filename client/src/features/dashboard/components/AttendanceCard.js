import React, { useState, useEffect } from "react";
import axios from "axios";
import TitleCard from "../../../components/Cards/TitleCard";

const API = axios.create({
  baseURL: "http://localhost:4000/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token && req.headers) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

const AttendanceCard = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [role] = useState(localStorage.getItem("role"));
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDate, setSearchDate] = useState("");

  const fetchAttendance = async () => {
    try {
      setLoading(true);

      let url = "";
      const params = new URLSearchParams({
        page: "1",
        limit: "10",
      });

      if (role === "Admin" || role === "Project Manager") {
        params.append("month", month.toString());
        params.append("year", year.toString());
        if (searchDate) params.append("date", searchDate);
        if (searchTerm) params.append("search", searchTerm);
        url = `/attendance?${params.toString()}`;
      } else {
        url = `/attendance/my?page=1&limit=10`;
      }

      const res = await API.get(url);

      // Handle the new paginated response format
      if (res.data && res.data.data) {
        setAttendance(res.data.data);
      } else {
        // Fallback for backward compatibility
        setAttendance(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Failed to fetch attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [month, year, searchTerm, searchDate]);

  return (
    <TitleCard title="Recent Attendance" topMargin="mt-2">
      <div className="overflow-x-auto w-full h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-4">
            <div className="loading loading-spinner loading-md"></div>
          </div>
        ) : (
          <table className="table w-full">
            <thead>
              <tr>
                {(role === "Admin" || role === "Project Manager") && (
                  <th>Employee</th>
                )}
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length > 0 ? (
                attendance.slice(0, 10).map((att, i) => (
                  <tr key={i}>
                    {(role === "Admin" || role === "Project Manager") && (
                      <td>
                        <div className="font-medium">
                          {att.employeeId?.fullname ||
                            att.employeeId?.name ||
                            "—"}
                        </div>
                      </td>
                    )}
                    <td>{new Date(att.date).toLocaleDateString()}</td>
                    <td>
                      <div
                        className={`badge ${
                          att.attendanceDay === "Present"
                            ? "badge-success"
                            : att.attendanceDay === "Leave"
                            ? "badge-info"
                            : "badge-error"
                        }`}
                      >
                        {att.attendanceDay}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={
                      role === "Admin" || role === "Project Manager" ? 3 : 2
                    }
                    className="text-center py-4"
                  >
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </TitleCard>
  );
};

export default AttendanceCard;
