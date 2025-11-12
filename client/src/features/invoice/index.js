import React, { useState, useEffect } from "react";
import axios from "axios";

export default function InvoiceDashboard() {
  const axiosInstance = axios.create({
    baseURL: "http://localhost:4000/api", // change if needed
  });

  axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    email: "",
    phone: "",
    address: "",
    items: [{ description: "", quantity: 1, rate: 0, price: 0 }],
  });

  const GST_RATE = 18;

  // === Fetch all invoices ===
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/invoices");
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // === Handlers ===
  const handleItemChange = (index, field, value) => {
    const items = [...formData.items];
    items[index][field] = value;

    if (field === "quantity" || field === "rate") {
      const qty = parseFloat(items[index].quantity || 0);
      const rate = parseFloat(items[index].rate || 0);
      items[index].price = qty * rate;
    }

    setFormData({ ...formData, items });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { description: "", quantity: 1, rate: 0, price: 0 },
      ],
    });
  };

  const removeItem = (index) => {
    const items = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items });
  };

  const calcSubtotal = () =>
    formData.items.reduce(
      (sum, item) => sum + (parseFloat(item.price) || 0),
      0
    );

  const calcGrandTotal = () => {
    const subtotal = calcSubtotal();
    return subtotal + (subtotal * GST_RATE) / 100;
  };

  // === Create Invoice ===
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await axiosInstance.post("/invoices", formData);
      alert(`Invoice ${res.data.invoice.invoiceNo} created successfully`);
      setFormOpen(false);
      setFormData({
        clientName: "",
        email: "",
        phone: "",
        address: "",
        items: [{ description: "", quantity: 1, rate: 0, price: 0 }],
      });
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || "Error creating invoice");
    } finally {
      setCreating(false);
    }
  };

  // === UI ===
  return (
    <div className="max-w-6xl mx-auto mt-8 p-6  shadow-lg rounded-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Invoices</h2>
        <button
          onClick={() => setFormOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Invoice
        </button>
      </div>

      {/* === Invoice Table === */}
      <div className="overflow-x-auto">
        {loading ? (
          <p className="text-center py-4">Loading invoices...</p>
        ) : invoices.length === 0 ? (
          <p className="text-center py-4 text-gray-600">No invoices found.</p>
        ) : (
          <table className="w-full border-collapse border text-left text-sm">
            <thead>
              <tr className=" ">
                <th className="border p-2">Invoice No</th>
                <th className="border p-2">Client</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Phone</th>
                <th className="border p-2">Total</th>
                <th className="border p-2">Created At</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id}>
                  <td className="border p-2 font-semibold">{inv.invoiceNo}</td>
                  <td className="border p-2">{inv.clientName}</td>
                  <td className="border p-2">{inv.email}</td>
                  <td className="border p-2">{inv.phone}</td>
                  <td className="border p-2">₹{inv.grandTotal?.toFixed(2)}</td>
                  <td className="border p-2">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* === Popup Modal Form === */}
      {formOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 relative">
            <button
              onClick={() => setFormOpen(false)}
              className="absolute top-3 right-4 text-gray-500 text-2xl hover:text-gray-800"
            >
              ×
            </button>

            <h3 className="text-xl font-semibold text-center mb-4">
              Create New Invoice
            </h3>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Client Name"
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                  className="border p-2 rounded w-full"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="border p-2 rounded w-full"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="border p-2 rounded w-full"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="border p-2 rounded w-full"
                />
              </div>

              {/* Items */}
              <div>
                <h4 className="text-lg font-semibold mb-2">Items</h4>
                {formData.items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-5 gap-2 items-center mb-2 border-b pb-2"
                  >
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                      className="border p-2 rounded"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, "quantity", e.target.value)
                      }
                      className="border p-2 rounded"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) =>
                        handleItemChange(index, "rate", e.target.value)
                      }
                      className="border p-2 rounded"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.price}
                      readOnly
                      className="border p-2 rounded bg-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 font-bold text-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItem}
                  className="text-blue-600 font-semibold mt-2"
                >
                  + Add Item
                </button>
              </div>

              {/* Totals */}
              <div className="flex justify-between items-center mt-4">
                <p className="font-semibold">GST: 18%</p>
                <div className="text-right">
                  <p>Subtotal: ₹{calcSubtotal().toFixed(2)}</p>
                  <p>Grand Total (incl. GST): ₹{calcGrandTotal().toFixed(2)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  {creating ? "Saving..." : "Save Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
