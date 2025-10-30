// src/components/LeaveCard.jsx
const LeaveCard = ({ record, userRole, onStatusChange }) => {
  return (
    <div className="card bg-base-100 shadow-md p-4 mb-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{record.employeeName}</h3>
          <p className="text-sm text-gray-500">ID: {record.employeeId}</p>
        </div>
        <div>
          <span
            className={`badge ${
              record.status === "Approved"
                ? "badge-success"
                : record.status === "Rejected"
                ? "badge-error"
                : "badge-warning"
            }`}
          >
            {record.status}
          </span>
        </div>
      </div>

      <p className="mt-2">
        <strong>Type:</strong> {record.typeOfLeave}
      </p>
      <p>
        <strong>Duration:</strong>{" "}
        {record.leaveType === "Full Day"
          ? `From ${new Date(
              record.startDate
            ).toLocaleDateString()} To ${new Date(
              record.endDate
            ).toLocaleDateString()}`
          : new Date(record.startDate).toLocaleDateString()}
      </p>
      <p>
        <strong>No. Days:</strong> {record.noOfLeaveDays}
      </p>
      <p>
        <strong>Message:</strong> {record.message}
      </p>

      {userRole === "manager" && record.status === "Pending" && (
        <div className="mt-3 flex gap-2">
          <button
            className="btn btn-success btn-sm"
            onClick={() => onStatusChange(record._id, "Approved")}
          >
            Approve
          </button>
          <button
            className="btn btn-error btn-sm"
            onClick={() => onStatusChange(record._id, "Rejected")}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

export default LeaveCard;
