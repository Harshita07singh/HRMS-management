import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TitleCard from "../../components/Cards/TitleCard";
import Pagination from "../../components/Pagination";

const Leave = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const [leaves, setLeaves] = useState([]);
  const [employeeData, setEmployeeData] = useState(null);
  const [form, setForm] = useState({
    employeeid: "",
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  // Fetch leaves (and employee data)
  // const fetchLeaves = async (page = 1, limit = 10) => {
  //   try {
  //     setLoading(true);
  //     const url =
  //       role === "Employee"
  //         ? `http://localhost:4000/api/leaves/my-leaves?page=${page}&limit=${limit}`
  //         : `http://localhost:4000/api/leaves?page=${page}&limit=${limit}`;

  //     const res = await fetch(url, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     const data = await res.json();
  //     if (!res.ok) throw new Error(data.message || "Failed to fetch leaves");

  //     if (role === "Employee" && data.employee) {
  //       setEmployeeData(data.employee);
  //       setLeaves(data.data || []);
  //       setPagination(
  //         data.pagination || {
  //           currentPage: 1,
  //           totalPages: 1,
  //           totalItems: data.data?.length || 0,
  //           itemsPerPage: limit,
  //           hasNextPage: false,
  //           hasPrevPage: false,
  //         }
  //       );
  //     } else {
  //       setLeaves(data.data || []);
  //       setPagination(
  //         data.pagination || {
  //           currentPage: 1,
  //           totalPages: 1,
  //           totalItems: data.data?.length || 0,
  //           itemsPerPage: limit,
  //           hasNextPage: false,
  //           hasPrevPage: false,
  //         }
  //       );
  //     }
  //   } catch (err) {
  //     setError(err.message);
  //     // Fallback for backward compatibility
  //     setLeaves(Array.isArray(data) ? data : data.leaves || []);
  //     setPagination({
  //       currentPage: 1,
  //       totalPages: 1,
  //       totalItems: Array.isArray(data)
  //         ? data.length
  //         : data.leaves?.length || 0,
  //       itemsPerPage: 10,
  //       hasNextPage: false,
  //       hasPrevPage: false,
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchLeaves = async (page = 1, limit = 10) => {
    let responseData = null; // ⬅️ define outside

    try {
      setLoading(true);
      const url =
        role === "Employee"
          ? `http://localhost:4000/api/leaves/my-leaves?page=${page}&limit=${limit}`
          : `http://localhost:4000/api/leaves?page=${page}&limit=${limit}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      responseData = await res.json(); // save data here

      if (!res.ok)
        throw new Error(responseData.message || "Failed to fetch leaves");

      if (role === "Employee" && responseData.employee) {
        setEmployeeData(responseData.employee);
      }

      setLeaves(responseData.data || []);
      setPagination(
        responseData.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: responseData.data?.length || 0,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPrevPage: false,
        }
      );
    } catch (err) {
      console.error(err);
      setError(err.message);

      // Use responseData (fallback if available)
      const fallback = Array.isArray(responseData)
        ? responseData
        : responseData?.leaves || [];

      setLeaves(fallback);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: fallback.length,
        itemsPerPage: limit,
        hasNextPage: false,
        hasPrevPage: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    fetchLeaves(newPage, pagination.itemsPerPage);
  };

  useEffect(() => {
    fetchLeaves(1, pagination.itemsPerPage);
  }, []);

  // Apply Leave
  const handleApply = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload =
        form.leaveType === "Half Day"
          ? {
              employeeid: form.employeeid,
              leaveType: form.leaveType,
              startDate: form.startDate,
              endDate: form.startDate,
              reason: form.reason,
            }
          : form;

      const res = await fetch("http://localhost:4000/api/leaves/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Leave application failed");

      // ⚠️ Show unpaid leave warning
      if (data.unpaidWarning) {
        const confirmLeave = window.confirm(
          "You have not any paid leave left.\nIf you take leave now, it will be marked as unpaid leave.\nDo you still want to continue?"
        );
        if (!confirmLeave) {
          setLoading(false);
          return;
        }
      }

      setSuccess("Leave applied successfully!");
      setForm({
        employeeid: "",
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: "",
      });
      setIsModalOpen(false);
      fetchLeaves(pagination.currentPage, pagination.itemsPerPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Approve/Reject Leave
  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch(`http://localhost:4000/api/leaves/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update status");

      setSuccess(`Leave ${status.toLowerCase()} successfully.`);
      fetchLeaves(pagination.currentPage, pagination.itemsPerPage);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <TitleCard title="Leave Management" topMargin="mt-2">
      <div className="flex justify-between mb-4">
        <div className="max-w-7xl mx-auto  p-8 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <div>
              {role === "Employee" && (
                <p className="text-sm text-gray-500 mt-1">
                  Available Paid Leaves:{"  "}
                  <strong>{employeeData?.available_PL ?? "-"}</strong>
                </p>
              )}
            </div>

            {role !== "Admin" && role !== "Project Manager" && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
              >
                Apply Leave
              </button>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-4">
              <div className="loading loading-spinner loading-md"></div>
            </div>
          )}

          {/* Leave Table */}
          <div>
            <h2 className="text-xl font-semibold mb-4">All Leave Requests</h2>
            <div className="overflow-x-auto w-full">
              <table className="table table-zebra w-full text-sm">
                <thead className="bg-base-300 ">
                  <tr>
                    <th>#</th>
                    {role !== "Employee" && <th>Employee</th>}
                    <th>Type</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Status</th>
                    {role !== "Employee" && <th>Actions</th>}
                    <th>View</th>
                  </tr>
                </thead>

                <tbody>
                  {leaves.length === 0 && !loading ? (
                    <tr>
                      <td
                        colSpan={role === "Employee" ? 6 : 8}
                        className="text-center py-4 text-gray-500"
                      >
                        No leave records found
                      </td>
                    </tr>
                  ) : (
                    leaves.map((leave, index) => (
                      <tr key={leave._id} className="">
                        <td>{index + 1}</td>

                        {role !== "Employee" && (
                          <td>
                            {leave.employee ? (
                              <div>
                                <p className="font-medium">
                                  {leave.employee.fullname ||
                                    leave.employee.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ID: {leave.employee.employee_id || "N/A"}
                                </p>
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </td>
                        )}

                        <td>{leave.leaveType}</td>
                        <td>
                          {new Date(leave.startDate).toLocaleDateString()}
                        </td>
                        <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                        <td>
                          <span
                            className={`px-2 py-1 rounded text-white text-xs ${
                              leave.status === "Approved"
                                ? "bg-green-500"
                                : leave.status === "Rejected"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                            }`}
                          >
                            {leave.status}
                          </span>
                        </td>

                        {role !== "Employee" && (
                          <td>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleStatusChange(leave._id, "Approved")
                                }
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusChange(leave._id, "Rejected")
                                }
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        )}

                        <td>
                          <button
                            onClick={() => setSelectedLeave(leave)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.totalPages > 0 && (
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  itemsPerPage={pagination.itemsPerPage}
                  totalItems={pagination.totalItems}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </div>

          {error && <p className="text-red-500 mt-3">{error}</p>}
          {success && <p className="text-green-600 mt-3">{success}</p>}
        </div>

        {/* Apply Leave Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
              <button
                className="absolute top-2 right-3 text-gray-500 hover:text-black"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>

              <h2 className="text-xl font-semibold mb-4 text-center">
                Apply for Leave
              </h2>

              <form onSubmit={handleApply}>
                <div className="mb-3">
                  <label className="block font-medium mb-1">Employee ID</label>
                  <input
                    type="text"
                    placeholder="Enter your Employee ID"
                    className="border p-2 rounded w-full"
                    value={form.employeeid}
                    onChange={(e) =>
                      setForm({ ...form, employeeid: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="block font-medium mb-1">Leave Type</label>
                  <select
                    className="border p-2 rounded w-full"
                    value={form.leaveType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        leaveType: e.target.value,
                        startDate: "",
                        endDate: "",
                      })
                    }
                    required
                  >
                    <option value="">Select Leave Type</option>
                    <option value="Full Day">Full Day</option>
                    <option value="Half Day">Half Day</option>
                  </select>
                </div>

                {form.leaveType === "Half Day" ? (
                  <div className="mb-3">
                    <label className="block font-medium mb-1">Date</label>
                    <input
                      type="date"
                      className="border p-2 rounded w-full"
                      value={form.startDate}
                      onChange={(e) =>
                        setForm({ ...form, startDate: e.target.value })
                      }
                      required
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block font-medium mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        className="border p-2 rounded w-full"
                        value={form.startDate}
                        onChange={(e) =>
                          setForm({ ...form, startDate: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium mb-1">End Date</label>
                      <input
                        type="date"
                        className="border p-2 rounded w-full"
                        value={form.endDate}
                        onChange={(e) =>
                          setForm({ ...form, endDate: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="block font-medium mb-1">Reason</label>
                  <textarea
                    placeholder="Enter reason"
                    className="border p-2 rounded w-full"
                    value={form.reason}
                    onChange={(e) =>
                      setForm({ ...form, reason: e.target.value })
                    }
                    rows={3}
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`btn btn-primary w-full ${
                    loading ? "loading" : ""
                  }`}
                >
                  {loading ? "Submitting..." : "Submit Leave"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* View Leave Details */}
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
                  <strong>Email:</strong>{" "}
                  {selectedLeave.employee?.email || "N/A"}
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
      </div>
    </TitleCard>
  );
};

export default Leave;
