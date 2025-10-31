import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Leave = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const [leaves, setLeaves] = useState([]);
  const [form, setForm] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  // Fetch leaves (different for Employee / Admin)
  const fetchLeaves = async () => {
    try {
      const url =
        role === "Employee"
          ? "http://localhost:4000/api/leaves/my-leaves"
          : "http://localhost:4000/api/leaves";

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch leaves");

      setLeaves(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchLeaves();
    // eslint-disable-next-line
  }, []);

  // Handle form submission
  const handleApply = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/leaves/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Leave application failed");

      setSuccess("Leave applied successfully!");
      setForm({ leaveType: "", startDate: "", endDate: "", reason: "" });
      fetchLeaves();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle status update (Admin / Project Manager)
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
      fetchLeaves();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 py-10 px-6">
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">
          Leave Management
        </h1>

        {/* ✅ Employee Apply Form */}
        {role === "Employee" && (
          <form onSubmit={handleApply} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Apply for Leave</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <select
                className="border p-2 rounded"
                value={form.leaveType}
                onChange={(e) =>
                  setForm({ ...form, leaveType: e.target.value })
                }
                required
              >
                <option value="">Select Leave Type</option>
                <option value="Sick">Sick</option>
                <option value="Casual">Casual</option>
                <option value="Earned">Earned</option>
                <option value="Unpaid">Unpaid</option>
              </select>

              <input
                type="date"
                className="border p-2 rounded"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                required
              />

              <input
                type="date"
                className="border p-2 rounded"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />

              <input
                type="text"
                placeholder="Reason"
                className="border p-2 rounded col-span-2"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>

            {error && <p className="text-red-500 mt-3">{error}</p>}
            {success && <p className="text-green-600 mt-3">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`btn btn-primary mt-4 w-full ${
                loading ? "loading" : ""
              }`}
            >
              {loading ? "Submitting..." : "Apply Leave"}
            </button>
          </form>
        )}

        {/* 📋 Leave List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {role === "Employee" ? "My Leaves" : "All Leave Requests"}
          </h2>

          <div className="overflow-x-auto">
            <table className="table w-full border">
              <thead>
                <tr className="bg-base-300">
                  <th>#</th>
                  {role !== "Employee" && <th>Employee</th>}
                  <th>Type</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Reason</th>
                  <th>Status</th>
                  {role !== "Employee" && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr>
                    <td
                      colSpan={role === "Employee" ? 6 : 8}
                      className="text-center py-4"
                    >
                      No leave records found
                    </td>
                  </tr>
                ) : (
                  leaves.map((leave, index) => (
                    <tr key={leave._id}>
                      <td>{index + 1}</td>
                      {role !== "Employee" && (
                        <td>{leave.employee?.name || "N/A"}</td>
                      )}
                      <td>{leave.leaveType}</td>
                      <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                      <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                      <td>{leave.reason}</td>
                      <td>
                        <span
                          className={`px-2 py-1 rounded text-white ${
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

                      {/* ✅ Admin/PM Actions */}
                      {role !== "Employee" && (
                        <td className="space-x-2">
                          <button
                            onClick={() =>
                              handleStatusChange(leave._id, "Approved")
                            }
                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(leave._id, "Rejected")
                            }
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leave;
