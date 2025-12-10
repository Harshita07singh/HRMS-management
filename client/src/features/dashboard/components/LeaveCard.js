import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TitleCard from "../../../components/Cards/TitleCard";

const Leave = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const [leaves, setLeaves] = useState([]);
  const [employeeData, setEmployeeData] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  // Fetch leaves
  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const url =
        role === "Employee"
          ? "https://hrms-management-backend.onrender.com/api/leaves/my-leaves?page=1&limit=10"
          : "https://hrms-management-backend.onrender.com/api/leaves?page=1&limit=10";

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch leaves");

      if (role === "Employee" && data.employee) {
        setEmployeeData(data.employee);
        // Handle the new paginated response format
        setLeaves(data.data || data.leaves || []);
      } else {
        // Handle the new paginated response format
        setLeaves(data.data || data || []);
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  return (
    <>
      <TitleCard title="Recent Leave Requests" topMargin="mt-2">
        <div className="overflow-x-auto w-full h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4">
              <div className="loading loading-spinner loading-md"></div>
            </div>
          ) : (
            <table className="table w-full">
              <thead>
                <tr>
                  <th>#</th>
                  {role !== "Employee" && <th>Employee</th>}
                  <th>Type</th>
                  <th>Status</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length > 0 ? (
                  leaves.slice(0, 10).map((leave, index) => (
                    <tr key={leave._id}>
                      <td>{index + 1}</td>
                      {role !== "Employee" && (
                        <td>
                          <div className="font-medium">
                            {leave.employee?.fullname ||
                              leave.employee?.name ||
                              "—"}
                          </div>
                          <div className="text-xs opacity-50">
                            {leave.employee?.employee_id || "N/A"}
                          </div>
                        </td>
                      )}
                      <td>{leave.leaveType}</td>
                      <td>
                        <div
                          className={`badge ${
                            leave.status === "Approved"
                              ? "badge-success"
                              : leave.status === "Rejected"
                              ? "badge-error"
                              : "badge-warning"
                          }`}
                        >
                          {leave.status}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedLeave(leave)}
                          className="btn btn-sm btn-ghost"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={role !== "Employee" ? 5 : 4}
                      className="text-center py-4"
                    >
                      No leave records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </TitleCard>

      {selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-3 text-gray-500 hover:text-black"
              onClick={() => setSelectedLeave(null)}
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4 text-center">
              Leave Details
            </h2>

            <div className="space-y-3 text-sm">
              <p>
                <strong>Employee ID:</strong>{" "}
                {selectedLeave.employee?.employee_id || "N/A"}
              </p>
              <p>
                <strong>Name:</strong>{" "}
                {selectedLeave.employee?.fullname ||
                  selectedLeave.employee?.name ||
                  "N/A"}
              </p>
              <p>
                <strong>Email:</strong> {selectedLeave.employee?.email || "N/A"}
              </p>
              <p>
                <strong>Leave Type:</strong> {selectedLeave.leaveType}
              </p>
              <p>
                <strong>Start:</strong>{" "}
                {new Date(selectedLeave.startDate).toLocaleDateString()}
              </p>
              <p>
                <strong>End:</strong>{" "}
                {new Date(selectedLeave.endDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Reason:</strong> {selectedLeave.reason}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`px-2 py-1 rounded text-white text-xs ${
                    selectedLeave.status === "Approved"
                      ? "bg-green-500"
                      : selectedLeave.status === "Rejected"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                  }`}
                >
                  {selectedLeave.status}
                </span>
              </p>
            </div>

            <div className="mt-6 text-center">
              <button
                className="btn btn-primary"
                onClick={() => setSelectedLeave(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Leave;
