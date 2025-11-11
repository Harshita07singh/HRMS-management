// controllers/payrollController.js
import Payroll from "../models/Payroll.js";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendence.js"; // matches your project filename
import Leave from "../models/Leave.js";
import mongoose from "mongoose";

// helper: count calendar days inclusive
const daysBetween = (start, end) => {
  const a = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const b = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diff = Math.floor((b - a) / (1000 * 60 * 60 * 24));
  return diff + 1;
};

// helper: working days excluding weekends (Sat/Sun)
const countWorkingDaysExcludingWeekends = (start, end) => {
  let count = 0;
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur <= last) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

// build date range query for midnight-to-midnight
const dateRangeQuery = (start, end) => ({
  $gte: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
  $lt: new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1),
});

// Admin: generate payroll for a single employee (and save)
export const generatePayroll = async (req, res) => {
  try {
    const {
      employeeId,
      payrollStart,
      payrollEnd,
      basicPay,
      tax = 0,
      bonus = 0,
      extraDeduction = 0,
    } = req.body;

    if (!employeeId || !payrollStart || !payrollEnd || !basicPay) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // validate employee
    const employee = await Employee.findById(employeeId);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    const start = new Date(payrollStart);
    const end = new Date(payrollEnd);
    if (end < start)
      return res.status(400).json({ message: "Invalid date range" });

    // total days & working days
    const totalDaysInPeriod = daysBetween(start, end);
    const totalWorkingDays = countWorkingDaysExcludingWeekends(start, end);

    // present days: attendance documents with attendanceDay === "Present"
    const presentCount = await Attendance.countDocuments({
      employeeId: mongoose.Types.ObjectId(employeeId),
      date: dateRangeQuery(start, end),
      attendanceDay: "Present",
    });

    // paid leaves: approved leaves overlapping period and isPaid === true
    const paidLeaves = await Leave.find({
      employee: employeeId,
      status: "Approved",
      isPaid: true,
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }, // overlap
      ],
    });

    const paidLeaveDays = paidLeaves.reduce((sum, l) => {
      // calculate overlap days between l.startDate and l.endDate and payroll range
      const s = l.startDate > start ? l.startDate : start;
      const e = l.endDate < end ? l.endDate : end;
      const days = daysBetween(new Date(s), new Date(e));
      return sum + days;
    }, 0);

    // unpaid leaves: approved && isPaid === false
    const unpaidLeavesDocs = await Leave.find({
      employee: employeeId,
      status: "Approved",
      isPaid: false,
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
    });

    const unpaidLeaveDays = unpaidLeavesDocs.reduce((sum, l) => {
      const s = l.startDate > start ? l.startDate : start;
      const e = l.endDate < end ? l.endDate : end;
      const days = daysBetween(new Date(s), new Date(e));
      return sum + days;
    }, 0);

    // NOTE: there could be days without attendance records (e.g. absent unrecorded).
    // We'll treat unpaid leaves explicitly (handled above). If an employee neither punched present nor had a paid leave,
    // we do NOT auto-count them as unpaid absent here — you can adapt this rule if you want strict absence deductions.
    //
    // We'll calculate deduction only for unpaidLeaveDays (per your requirement).
    //
    // Deduction per unpaid day = basicPay / totalWorkingDays
    const perDayRate = totalWorkingDays > 0 ? basicPay / totalWorkingDays : 0;
    const deductionForUnpaidLeaves =
      Math.round(perDayRate * unpaidLeaveDays * 100) / 100;

    // tax: interpret numeric value as percentage if between 0 and 100 and integer; else treat as fixed amount
    let taxAmount = 0;
    if (tax > 0 && tax <= 100) {
      taxAmount =
        Math.round(
          (((basicPay - deductionForUnpaidLeaves + bonus) * tax) / 100) * 100
        ) / 100;
    } else {
      taxAmount = tax; // fixed
    }

    const netPay =
      Math.round(
        (basicPay -
          deductionForUnpaidLeaves -
          taxAmount +
          bonus -
          extraDeduction) *
          100
      ) / 100;

    // persist payroll
    const payroll = await Payroll.create({
      employeeId,
      payrollStart: start,
      payrollEnd: end,
      basicPay,
      tax,
      bonus,
      extraDeduction,
      totalDaysInPeriod,
      totalWorkingDays,
      presentDays: presentCount,
      paidLeaveDays,
      unpaidLeaveDays,
      deductionForUnpaidLeaves,
      taxAmount,
      netPay,
      createdBy: req.user.id,
    });

    const populated = await Payroll.findById(payroll._id).populate(
      "employeeId",
      "employee_id fullname email"
    );

    res.status(201).json({ message: "Payroll generated", payroll: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Admin: list payrolls (with optional filters)
export const listPayrolls = async (req, res) => {
  try {
    const { employee, month, year } = req.query;
    const query = {};

    if (employee) query.employeeId = employee;
    if (month || year) {
      // filter by payrollStart month/year
      const m = month ? parseInt(month) : null;
      const y = year ? parseInt(year) : null;
      if (m && y) {
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 0, 23, 59, 59, 999);
        query.payrollStart = { $gte: start, $lte: end };
      } else if (y) {
        const start = new Date(y, 0, 1);
        const end = new Date(y, 11, 31, 23, 59, 59, 999);
        query.payrollStart = { $gte: start, $lte: end };
      }
    }

    const records = await Payroll.find(query)
      .populate("employeeId", "employee_id fullname email")
      .sort({ payrollStart: -1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findById(id).populate(
      "employeeId",
      "employee_id fullname email"
    );
    if (!payroll) return res.status(404).json({ message: "Payroll not found" });
    res.json(payroll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
