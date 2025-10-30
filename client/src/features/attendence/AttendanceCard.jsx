const AttendanceCard = ({ record }) => (
  <div className="card bg-base-100 shadow-md p-4 mb-2">
    <h3 className="text-lg font-semibold">{record.name}</h3>
    <p>
      <strong>Date:</strong> {record.date}
    </p>
    <p>
      <strong>Status:</strong> {record.status}
    </p>
  </div>
);

export default AttendanceCard;
