import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    leavesCount: { type: Number, default: 0 },
    workingDays: { type: Number, default: 0 },
    payrollStartDate: { type: Date, required: true },
    payrollEndDate: { type: Date, required: true },
    basicPay: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    deduction: { type: Number, default: 0 },
    netPay: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Payroll", payrollSchema);
