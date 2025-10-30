// src/components/LeaveList.jsx
import { useEffect, useState } from "react";
import LeaveCard from "./Leavecard";
import LeaveFormModal from "./LeaveFormModal";
import { apiFetch } from "./api";

const LeaveList = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [leaves, setLeaves] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchLeaves = async () => {
    const q = `?page=${page}&limit=${limit}${
      search ? `&search=${encodeURIComponent(search)}` : ""
    }${statusFilter ? `&status=${statusFilter}` : ""}`;
    const res = await apiFetch(`/api/leaves${q}`, { method: "GET" });
    const data = await res.json();
    if (res.ok) {
      setLeaves(data.data);
      setTotal(data.total);
    } else {
      // handle unauthorized / other
      console.error(data);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [page, search, statusFilter]);

  const handleSaved = (newLeave) => {
    // new records appear at top
    setLeaves((prev) => [newLeave, ...prev]);
    setTotal((t) => t + 1);
  };

  const handleStatusChange = async (id, status) => {
    const res = await apiFetch(`/api/leaves/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (res.ok) {
      setLeaves((prev) => prev.map((l) => (l._id === id ? data.leave : l)));
    } else {
      alert(data.message || "Failed to update");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Leave Requests</h2>
        {user?.role === "employee" && (
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            + Apply
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          className="input input-bordered"
          placeholder="Search name/id/type"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select select-bordered"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {leaves.length === 0 ? (
        <p className="text-center text-gray-500">No leaves found.</p>
      ) : (
        leaves.map((l) => (
          <LeaveCard
            key={l._id}
            record={l}
            userRole={user?.role}
            onStatusChange={handleStatusChange}
          />
        ))
      )}

      <div className="flex justify-between items-center mt-4">
        <div>
          Showing {leaves.length} of {total}
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <button
            className="btn btn-sm"
            disabled={page * limit >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {showModal && (
        <LeaveFormModal
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default LeaveList;
