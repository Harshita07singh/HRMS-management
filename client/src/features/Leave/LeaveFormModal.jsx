// import { useState } from "react";

// const LeaveFormModal = ({ onClose, onSubmit }) => {
//   const [formData, setFormData] = useState({
//     name: "",
//     leaveType: "half", // default: Half Day
//     date: "",
//     startDate: "",
//     endDate: "",
//     reason: "",
//   });

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     // Prepare clean data based on leave type
//     const leaveData =
//       formData.leaveType === "half"
//         ? {
//             name: formData.name,
//             leaveType: "Half Day",
//             date: formData.date,
//             reason: formData.reason,
//           }
//         : {
//             name: formData.name,
//             leaveType: "Full Day",
//             startDate: formData.startDate,
//             endDate: formData.endDate,
//             reason: formData.reason,
//           };

//     onSubmit(leaveData);
//     onClose();
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
//       <form
//         onSubmit={handleSubmit}
//         className="bg-white p-6 rounded shadow-md w-96"
//       >
//         <h2 className="text-xl font-bold mb-4">Mark Leave</h2>

//         {/* Employee Name */}
//         <input
//           type="text"
//           placeholder="Employee Name"
//           className="input input-bordered w-full mb-3"
//           value={formData.name}
//           onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//           required
//         />

//         {/* Leave Type Selection */}
//         <div className="mb-4">
//           <label className="font-medium mr-4">Leave Type:</label>
//           <label className="mr-4">
//             <input
//               type="radio"
//               name="leaveType"
//               value="half"
//               checked={formData.leaveType === "half"}
//               onChange={(e) =>
//                 setFormData({ ...formData, leaveType: e.target.value })
//               }
//               className="mr-1"
//             />
//             Half Day
//           </label>
//           <label>
//             <input
//               type="radio"
//               name="leaveType"
//               value="full"
//               checked={formData.leaveType === "full"}
//               onChange={(e) =>
//                 setFormData({ ...formData, leaveType: e.target.value })
//               }
//               className="mr-1"
//             />
//             Full Day
//           </label>
//         </div>

//         {/* Conditional Date Inputs */}
//         {formData.leaveType === "half" ? (
//           <input
//             type="date"
//             className="input input-bordered w-full mb-3"
//             value={formData.date}
//             onChange={(e) => setFormData({ ...formData, date: e.target.value })}
//             required
//           />
//         ) : (
//           <div className="grid grid-cols-2 gap-3 mb-3">
//             <input
//               type="date"
//               placeholder="Start Date"
//               className="input input-bordered w-full"
//               value={formData.startDate}
//               onChange={(e) =>
//                 setFormData({ ...formData, startDate: e.target.value })
//               }
//               required
//             />
//             <input
//               type="date"
//               placeholder="End Date"
//               className="input input-bordered w-full"
//               value={formData.endDate}
//               onChange={(e) =>
//                 setFormData({ ...formData, endDate: e.target.value })
//               }
//               required
//             />
//           </div>
//         )}

//         {/* Reason */}
//         <textarea
//           placeholder="Reason"
//           className="textarea textarea-bordered w-full mb-4"
//           value={formData.reason}
//           onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
//           required
//         />

//         {/* Buttons */}
//         <div className="flex justify-end gap-2">
//           <button type="submit" className="btn btn-primary">
//             Save
//           </button>
//           <button type="button" className="btn" onClick={onClose}>
//             Cancel
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default LeaveFormModal;

// src/components/LeaveFormModal.jsx
import { useState } from "react";
import { apiFetch } from "./api";

const LeaveFormModal = ({ onClose, onSaved }) => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [form, setForm] = useState({
    typeOfLeave: "Casual Leave",
    leaveType: "half",
    startDate: "",
    endDate: "",
    message: "",
  });
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const payload = {
        typeOfLeave: form.typeOfLeave,
        leaveType: form.leaveType === "half" ? "Half Day" : "Full Day",
        startDate: form.startDate,
        endDate: form.leaveType === "half" ? form.startDate : form.endDate,
        message: form.message,
      };
      const res = await apiFetch("/api/leaves", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return setErr(data.message || "Failed");
      onSaved(data.leave);
      onClose();
    } catch (err) {
      setErr("Network error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <form onSubmit={submit} className="bg-white p-6 rounded shadow-md w-96">
        <h2 className="text-xl font-bold mb-4">Apply Leave</h2>
        {err && <div className="text-red-600 mb-2">{err}</div>}

        <select
          className="select select-bordered w-full mb-3"
          value={form.typeOfLeave}
          onChange={(e) => setForm({ ...form, typeOfLeave: e.target.value })}
        >
          <option>Casual Leave</option>
          <option>Sick Leave</option>
          <option>Earned Leave</option>
          <option>Maternity Leave</option>
          <option>Paternity Leave</option>
        </select>

        <div className="mb-3">
          <label className="mr-3">
            <input
              type="radio"
              checked={form.leaveType === "half"}
              onChange={() => setForm({ ...form, leaveType: "half" })}
            />{" "}
            Half Day
          </label>
          <label className="ml-3">
            <input
              type="radio"
              checked={form.leaveType === "full"}
              onChange={() => setForm({ ...form, leaveType: "full" })}
            />{" "}
            Full Day
          </label>
        </div>

        {form.leaveType === "half" ? (
          <input
            type="date"
            className="input input-bordered w-full mb-3"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <input
              type="date"
              className="input input-bordered"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
            <input
              type="date"
              className="input input-bordered"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
            />
          </div>
        )}

        <textarea
          className="textarea textarea-bordered w-full mb-3"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
        />

        <div className="flex justify-end gap-2">
          <button type="submit" className="btn btn-primary">
            Submit
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveFormModal;
