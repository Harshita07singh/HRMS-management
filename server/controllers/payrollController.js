import Attendance from "../models/Attendence.js";
import Leave from "../models/Leave.js";
import Employee from "../models/Employee.js";
import Payroll from "../models/Payroll.js";

const dateRangeQuery = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999); //  include full end date
  return { $gte: startDate, $lte: endDate };
};

export const generatePayroll = async (req, res) => {
  try {
    const { startDate, endDate, tax = 2, bonus = 100 } = req.body;

    if (!startDate || !endDate)
      return res
        .status(400)
        .json({ message: "Please provide payroll start and end date" });

    const employees = await Employee.find({ status: "Active" });

    if (!employees.length)
      return res.status(404).json({ message: "No active employees found" });

    const results = [];

    for (const emp of employees) {
      const employeeId = emp._id;
      const basicPay = Number(emp.basicPay) || 30000;

      // Attendance & Leaves
      const attendances = await Attendance.find({
        employeeId,
        date: dateRangeQuery(startDate, endDate),
      });

      const paidLeaves = await Leave.find({
        employee: employeeId,
        startDate: dateRangeQuery(startDate, endDate),
        isPaid: true,
        status: "Approved",
      });

      const presentDays = attendances.filter(
        (a) => a.attendanceDay === "Present"
      ).length;

      const paidLeaveDays = paidLeaves.length;

      // Calculate unpaid days correctly
      const totalPaidDays = presentDays + paidLeaveDays;
      const unpaidDays = Math.max(0, 30 - totalPaidDays); // normalize to 30-day month
      const dailyRate = Number(basicPay) / 30;
      const deduction = Number((dailyRate * unpaidDays).toFixed(2));

      // Salary calculations
      const grossSalary = Number(basicPay) + Number(bonus);
      const taxAmount = Number(((grossSalary * Number(tax)) / 100).toFixed(2));
      const netSalary = Math.max(
        0,
        Number((grossSalary - deduction - taxAmount).toFixed(2))
      );

      // Prevent duplicate payroll for same period
      const exists = await Payroll.findOne({
        employeeId,
        payrollStartDate: new Date(startDate),
        payrollEndDate: new Date(endDate),
      });

      if (exists) continue;

      const payroll = await Payroll.create({
        employeeId,
        leavesCount: paidLeaveDays,
        workingDays: presentDays,
        payrollStartDate: new Date(startDate),
        payrollEndDate: new Date(endDate),
        basicPay,
        tax: Number(tax),
        bonus: Number(bonus),
        deduction,
        netPay: netSalary,
      });

      results.push(payroll);
    }

    res.status(201).json({
      message: `Payroll generated successfully for  employees.`,
      generatedCount: results.length,
    });
  } catch (err) {
    console.error("Error generating payroll:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get payrolls (Admin / Manager)
export const getAllPayrolls = async (req, res) => {
  try {
    const { month, year, search } = req.query;
    const query = {};

    // Filter by month/year
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      query.payrollStartDate = { $gte: start };
      query.payrollEndDate = { $lte: end };
    }

    // Search by name or email
    if (search) {
      const searchRegex = new RegExp(search, "i");
      const employees = await Employee.find({
        $or: [{ fullname: searchRegex }, { email: searchRegex }],
      }).select("_id");
      query.employeeId = { $in: employees.map((e) => e._id) };
    }

    const payrolls = await Payroll.find(query)
      .populate(
        "employeeId",
        "fullname email department designation employee_id"
      )
      .sort({ payrollStartDate: -1 });

    res.json(payrolls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
