import React, { useState, useEffect } from "react";
import axios from "axios";
import TitleCard from "../../components/Cards/TitleCard";
import Pagination from "../../components/Pagination";

const API = axios.create({
  baseURL: "https://hrms-management-backend.onrender.com/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [showModal, setShowModal] = useState(false); // ✅ For popup

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [formData, setFormData] = useState({
    employeeId: "",
    startDate: "",
    endDate: "",
    basicPay: "",
    bonus: "",
    tax: "",
  });

  const role = localStorage.getItem("role");

  // Restrict non-admins
  useEffect(() => {
    if (role !== "Admin") {
      setMessage("Access restricted to admin users only.");
    }
  }, [role]);

  const fetchPayrolls = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (month) params.append("month", month);
      if (year) params.append("year", year);
      if (search) params.append("search", search);

      const res = await API.get("/payroll", { params });

      // Handle the new paginated response format
      if (res.data && res.data.data) {
        setPayrolls(res.data.data);
        setPagination(res.data.pagination);
      } else {
        // Fallback for backward compatibility
        setPayrolls(res.data || []);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: res.data?.length || 0,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPrevPage: false,
        });
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to fetch payrolls");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    fetchPayrolls(newPage, pagination.itemsPerPage);
  };

  const fetchEmployees = async () => {
    try {
      const res = await API.get("/employees?page=1&limit=100");
      if (res.data && res.data.data) {
        setEmployees(res.data.data);
      } else {
        setEmployees(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load employees");
    }
  };

  const handleGeneratePayroll = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/payroll/generate", formData);
      setMessage(res.data.message);
      setFormData({
        employeeId: "",
        startDate: "",
        endDate: "",
        basicPay: "",
        bonus: "",
        tax: "",
      });
      setShowModal(false);
      fetchPayrolls(pagination.currentPage, pagination.itemsPerPage);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to generate payroll");
    }
  };

  useEffect(() => {
    fetchPayrolls(1, pagination.itemsPerPage);
  }, [month, year, search]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPayrolls(1, pagination.itemsPerPage);
    }, 400); // wait 400ms after typing before sending request
    return () => clearTimeout(delayDebounce);
  }, [month, year, search]);

  if (role !== "Admin") {
    return (
      <div className="flex justify-center items-center h-screen text-xl text-red-500">
        {message}
      </div>
    );
  }

  return (
    <TitleCard title="Payroll Management" topMargin="mt-2">
      <div className="p-6  min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Payroll Management</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            + Generate Payroll
          </button>
        </div>

        {/*  Filters */}
        <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
          <input
            type="text"
            placeholder="Search by name/email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 w-64"
          />
          <div className="flex gap-3">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">Month</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">Year</option>
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-4">
            <div className="loading loading-spinner loading-md"></div>
          </div>
        )}

        {/*  Payroll Table */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full shadow-md rounded-lg">
            <thead className=" text-gray-500">
              <tr className="px-3 py-3">
                <th>Employee</th>
                <th>Email</th>
                <th>Period</th>
                <th>Basic Pay</th>
                <th>Bonus</th>
                <th>Tax</th>
                <th>Deduction</th>
                <th>Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.length > 0 ? (
                payrolls.map((p, i) => (
                  <tr key={i} className="text-center px-3 py-3">
                    <td className="px-3 py-3">
                      {p.employeeId?.fullname || "—"}
                    </td>
                    <td>{p.employeeId?.email || "—"}</td>
                    <td>
                      {new Date(p.payrollStartDate).toLocaleDateString()} -{" "}
                      {new Date(p.payrollEndDate).toLocaleDateString()}
                    </td>
                    <td>₹{p.basicPay}</td>
                    <td>₹{p.bonus}</td>
                    <td>{p.tax}%</td>
                    <td className=" text-red-600">₹{p.deduction}</td>
                    <td className="text-green-600 font-semibold">
                      ₹{p.netPay}
                    </td>
                  </tr>
                ))
              ) : !loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-6 text-gray-500">
                    {search || month || year
                      ? "No payroll records found matching your filters"
                      : "No payroll records found"}
                  </td>
                </tr>
              ) : null}
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

        {message && (
          <p className="text-center text-blue-600 mt-4 font-medium">
            {message}
          </p>
        )}

        {/*  Generate Payroll Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-2 right-3 text-gray-500 hover:text-red-600 text-xl"
              >
                ✕
              </button>

              <h3 className="text-xl font-semibold mb-4 text-center">
                Generate Monthly Payroll
              </h3>

              <form onSubmit={handleGeneratePayroll}>
                <div className="flex flex-col gap-3">
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="border rounded-lg px-3 py-2"
                    required
                  />
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="border rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Generate
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </TitleCard>
  );
};

export default Payroll;
