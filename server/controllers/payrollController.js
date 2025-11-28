import Attendance from "../models/Attendence.js";
import Leave from "../models/Leave.js";
import Employee from "../models/Employee.js";
import Payroll from "../models/Payroll.js";
import nodemailer from "nodemailer";

const dateRangeQuery = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);
  return { $gte: startDate, $lte: endDate };
};

// ✅ Configure Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // e.g. yourcompany@gmail.com
    pass: process.env.EMAIL_PASS, // 16-char Gmail App Password
  },
});

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
      const totalPaidDays = presentDays + paidLeaveDays;
      const unpaidDays = Math.max(0, 30 - totalPaidDays);
      const dailyRate = Number(basicPay) / 30;
      const deduction = Number((dailyRate * unpaidDays).toFixed(2));

      const grossSalary = Number(basicPay) + Number(bonus);
      const taxAmount = Number(((grossSalary * Number(tax)) / 100).toFixed(2));
      const netSalary = Math.max(
        0,
        Number((grossSalary - deduction - taxAmount).toFixed(2))
      );

      // Avoid duplicate payroll for same period
      const exists = await Payroll.findOne({
        employeeId,
        payrollStartDate: new Date(startDate),
        payrollEndDate: new Date(endDate),
      });
      if (exists) continue;

      // Create new payroll
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

      // ✅ Send Email Notification to Employee
      if (emp.email) {
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: emp.email,
            subject: `Payroll Generated - ${new Date(startDate).toLocaleString(
              "default",
              {
                month: "long",
                year: "numeric",
              }
            )}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 10px; line-height: 1.5;">
                <h2>Hi ${emp.fullname || "Employee"},</h2>
                <p>Your payroll for the period 
                  <b>${new Date(startDate).toLocaleDateString()}</b> to 
                  <b>${new Date(
                    endDate
                  ).toLocaleDateString()}</b> has been successfully processed.
                </p>
                <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; margin-top: 10px;">
                  <tr><th align="left">Basic Pay</th><td>₹${basicPay}</td></tr>
                  <tr><th align="left">Bonus</th><td>₹${bonus}</td></tr>
                  <tr><th align="left">Tax</th><td>${tax}% (₹${taxAmount})</td></tr>
                  <tr><th align="left">Deduction</th><td>₹${deduction}</td></tr>
                  <tr><th align="left">Net Salary</th><td><b>₹${netSalary}</b></td></tr>
                </table>
                <p style="margin-top: 20px;">Thank you,<br/><b>HR Department</b></p>
              </div>
            `,
          });
          console.log(`✅ Email sent to ${emp.email}`);
        } catch (mailErr) {
          console.error(`❌ Failed to send email to ${emp.email}:`, mailErr);
        }
      }
    }

    res.status(201).json({
      message: `Payroll generated successfully for ${results.length} employees.`,
      generatedCount: results.length,
    });
  } catch (err) {
    console.error("Error generating payroll:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get all payrolls with pagination
export const getAllPayrolls = async (req, res) => {
  try {
    const { month, year, search } = req.query;
    const query = {};

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      query.payrollStartDate = { $gte: start };
      query.payrollEndDate = { $lte: end };
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      const employees = await Employee.find({
        $or: [{ fullname: searchRegex }, { email: searchRegex }],
      }).select("_id");
      query.employeeId = { $in: employees.map((e) => e._id) };
    }

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await Payroll.countDocuments(query);

    const payrolls = await Payroll.find(query)
      .populate(
        "employeeId",
        "fullname email department designation employee_id"
      )
      .sort({ payrollStartDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: payrolls,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPayrolls = async (req, res) => {
  try {
    const { month, year, search } = req.query;

    // Build query
    let query = {};

    // Filter by month & year if provided
    if (month && year) {
      const start = new Date(`${year}-${month}-01`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      query.payrollStartDate = { $gte: start, $lt: end };
    }

    // If searching by name or email
    if (search) {
      // Find employees whose name or email match
      const employees = await Employee.find({
        $or: [
          { fullname: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const employeeIds = employees.map((e) => e._id);
      query.employeeId = { $in: employeeIds };
    }

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await Payroll.countDocuments(query);

    const payrolls = await Payroll.find(query)
      .populate("employeeId", "fullname email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: payrolls,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching payrolls" });
  }
};
