import mongoose from "mongoose";
const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employeeid: { type: String, required: true },
    leaveType: { type: String, enum: ["Full Day", "Half Day"], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, trim: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    isPaid: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Leave", leaveSchema);
