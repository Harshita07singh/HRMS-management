import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    managerId: { type: String, default: null },
    typeOfLeave: {
      type: String,
      enum: [
        "Casual Leave",
        "Sick Leave",
        "Earned Leave",
        "Maternity Leave",
        "Paternity Leave",
      ],
      required: true,
    },
    leaveType: { type: String, enum: ["Half Day", "Full Day"], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    noOfLeaveDays: { type: Number, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const Leave = mongoose.model("Leave", leaveSchema);
export default Leave;
