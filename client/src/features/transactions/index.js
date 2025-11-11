// src/components/Payroll.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:4000/api" });
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

const Payroll = () => {
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    payrollStart: "",
    payrollEnd: "",
    basicPay: "",
    tax: 0,
    bonus: 0,
    extraDeduction: 0,
  });
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchEmployees();
    fetchPayrolls();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await API.get("/employees"); // assume you have employees endpoint
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const res = await API.get("/payroll");
      setPayrolls(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      // basic validation
      if (
        !form.employeeId ||
        !form.payrollStart ||
        !form.payrollEnd ||
        !form.basicPay
      ) {
        setMessage("Please fill required fields");
        return;
      }
      const payload = {
        employeeId: form.employeeId,
        payrollStart: form.payrollStart,
        payrollEnd: form.payrollEnd,
        basicPay: parseFloat(form.basicPay),
        tax: parseFloat(form.tax) || 0,
        bonus: parseFloat(form.bonus) || 0,
        extraDeduction: parseFloat(form.extraDeduction) || 0,
      };
      const res = await API.post("/payroll/generate", payload);
      setMessage(res.data.message);
      setForm({
        employeeId: "",
        payrollStart: "",
        payrollEnd: "",
        basicPay: "",
        tax: 0,
        bonus: 0,
        extraDeduction: 0,
      });
      fetchPayrolls();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to generate payroll");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">
        Payroll Management (Admin)
      </h2>

      {/* Create payroll */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <form
          onSubmit={handleGenerate}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <div>
            <label className="block text-sm">Employee</label>
            <select
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className="border p-2 rounded w-full"
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.fullname} ({emp.employee_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm">Payroll Start</label>
            <input
              type="date"
              value={form.payrollStart}
              onChange={(e) =>
                setForm({ ...form, payrollStart: e.target.value })
              }
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm">Payroll End</label>
            <input
              type="date"
              value={form.payrollEnd}
              onChange={(e) => setForm({ ...form, payrollEnd: e.target.value })}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm">Basic Pay</label>
            <input
              type="number"
              value={form.basicPay}
              onChange={(e) => setForm({ ...form, basicPay: e.target.value })}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm">Tax (percent or fixed)</label>
            <input
              type="number"
              value={form.tax}
              onChange={(e) => setForm({ ...form, tax: e.target.value })}
              className="border p-2 rounded w-full"
            />
            <small className="text-xs text-gray-500">
              If between 0-100 it's treated as percent
            </small>
          </div>

          <div>
            <label className="block text-sm">Bonus</label>
            <input
              type="number"
              value={form.bonus}
              onChange={(e) => setForm({ ...form, bonus: e.target.value })}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm">Extra Deduction</label>
            <input
              type="number"
              value={form.extraDeduction}
              onChange={(e) =>
                setForm({ ...form, extraDeduction: e.target.value })
              }
              className="border p-2 rounded w-full"
            />
          </div>

          <div className="md:col-span-2 flex gap-2 pt-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Generate Payroll
            </button>
            <button
              type="button"
              onClick={fetchPayrolls}
              className="bg-gray-200 px-4 py-2 rounded"
            >
              Refresh
            </button>
            <div className="text-sm text-green-600 ml-3">{message}</div>
          </div>
        </form>
      </div>

      {/* Payroll list */}
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-3">Payroll Records</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="py-1">Employee</th>
                <th>Period</th>
                <th>Basic</th>
                <th>Unpaid Leaves</th>
                <th>Deduction</th>
                <th>Tax</th>
                <th>Bonus</th>
                <th>Net Pay</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map((p) => (
                <tr key={p._id} className="border-t">
                  <td>
                    {p.employeeId?.fullname} ({p.employeeId?.employee_id})
                  </td>
                  <td>
                    {new Date(p.payrollStart).toLocaleDateString()} -{" "}
                    {new Date(p.payrollEnd).toLocaleDateString()}
                  </td>
                  <td>{p.basicPay}</td>
                  <td>{p.unpaidLeaveDays}</td>
                  <td>{p.deductionForUnpaidLeaves}</td>
                  <td>{p.taxAmount}</td>
                  <td>{p.bonus}</td>
                  <td className="font-semibold">{p.netPay}</td>
                  <td>
                    <button
                      className="text-blue-600"
                      onClick={() => setSelectedPayroll(p)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payroll detail modal */}
      {selectedPayroll && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow w-full max-w-2xl">
            <h3 className="text-xl font-semibold mb-4">Payroll Detail</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <strong>Employee</strong>
                <div>
                  {selectedPayroll.employeeId?.fullname} (
                  {selectedPayroll.employeeId?.employee_id})
                </div>
              </div>
              <div>
                <strong>Period</strong>
                <div>
                  {new Date(selectedPayroll.payrollStart).toLocaleDateString()}{" "}
                  - {new Date(selectedPayroll.payrollEnd).toLocaleDateString()}
                </div>
              </div>

              <div>
                <strong>Basic Pay</strong>
                <div>{selectedPayroll.basicPay}</div>
              </div>
              <div>
                <strong>Total Working Days</strong>
                <div>{selectedPayroll.totalWorkingDays}</div>
              </div>

              <div>
                <strong>Present Days</strong>
                <div>{selectedPayroll.presentDays}</div>
              </div>
              <div>
                <strong>Paid Leave Days</strong>
                <div>{selectedPayroll.paidLeaveDays}</div>
              </div>

              <div>
                <strong>Unpaid Leave Days</strong>
                <div>{selectedPayroll.unpaidLeaveDays}</div>
              </div>
              <div>
                <strong>Deduction for Unpaid</strong>
                <div>{selectedPayroll.deductionForUnpaidLeaves}</div>
              </div>

              <div>
                <strong>Tax</strong>
                <div>{selectedPayroll.taxAmount}</div>
              </div>
              <div>
                <strong>Bonus</strong>
                <div>{selectedPayroll.bonus}</div>
              </div>

              <div>
                <strong>Extra Deduction</strong>
                <div>{selectedPayroll.extraDeduction}</div>
              </div>
              <div>
                <strong>Net Pay</strong>
                <div className="font-semibold">{selectedPayroll.netPay}</div>
              </div>
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={() => setSelectedPayroll(null)}
                className="bg-gray-200 px-4 py-2 rounded"
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

export default Payroll;
