// models/Payroll.js
import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    payrollStart: { type: Date, required: true },
    payrollEnd: { type: Date, required: true },

    // inputs
    basicPay: { type: Number, required: true }, // monthly basic salary
    tax: { type: Number, default: 0 }, // if >1 treated as percentage (e.g. 10 -> 10%)
    bonus: { type: Number, default: 0 },
    extraDeduction: { type: Number, default: 0 }, // other deductions (fixed)

    // derived
    totalDaysInPeriod: Number,
    totalWorkingDays: Number, // excludes weekends
    presentDays: Number,
    paidLeaveDays: Number,
    unpaidLeaveDays: Number,
    deductionForUnpaidLeaves: Number,
    taxAmount: Number,
    netPay: Number,

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Payroll", payrollSchema);
