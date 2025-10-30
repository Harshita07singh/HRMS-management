
import { useState } from "react";
import AttendanceFormModal from "./AttendanceFormModal";
import AttendanceCard from "./AttendanceCard";

const AttendanceMarkDashboard = () => {
  const [showForm, setShowForm] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const handleAddAttendance = (newRecord) => {
    setAttendanceRecords((prev) => [...prev, newRecord]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employee Attendance Marking</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          Mark Attendance
        </button>
      </div>

      {showForm && (
        <AttendanceFormModal
          onClose={() => setShowForm(false)}
          onSubmit={handleAddAttendance}
        />
      )}

      <div>
        {attendanceRecords.length === 0 ? (
          <p className="text-gray-500">No attendance records yet.</p>
        ) : (
          attendanceRecords.map((record, index) => (
            <AttendanceCard key={index} record={record} />
          ))
        )}
      </div>
    </div>
  );
};

export default AttendanceMarkDashboard;
