import Leave from "../models/Leave.js";
import Employee from "../models/Employee.js";

// Apply for leave (Employee)
export const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason, employeeid } = req.body;
    const employeeId = req.user.employeeId;

    if (!employeeId)
      return res
        .status(403)
        .json({ message: "Only employees can apply for leave" });

    const employee = await Employee.findById(employeeId);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    let unpaidWarning = false;

    // If employee has no paid leaves left, show warning
    if (employee.available_PL <= 0) unpaidWarning = true;

    const leave = await Leave.create({
      employee: employeeId,
      employeeid,
      leaveType,
      startDate,
      endDate,
      reason,
    });

    res.status(201).json({
      message: "Leave applied successfully",
      leave,
      unpaidWarning,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟡 Get all leaves (Admin / PM)
export const getAllLeaves = async (req, res) => {
  try {
    const { role, email } = req.user;
    let leaves = [];

    if (role === "Admin") {
      leaves = await Leave.find().populate(
        "employee",
        "employee_id fullname email available_PL role"
      );
    } else if (role === "Project Manager") {
      const manager = await Employee.findOne({ email });
      if (!manager)
        return res.status(404).json({ message: "Manager not found" });

      const team = await Employee.find({
        reportingmanager: manager.fullname,
      }).select("_id");

      const teamIds = team.map((t) => t._id);

      leaves = await Leave.find({ employee: { $in: teamIds } }).populate(
        "employee",
        "employee_id fullname email available_PL role"
      );
    }

    res.status(200).json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ View own leaves (Employee)
export const getMyLeaves = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const employee = await Employee.findById(employeeId).select(
      "employee_id fullname email role available_PL"
    );

    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    const leaves = await Leave.find({ employee: employeeId })
      .populate("employee", "employee_id fullname email role available_PL")
      .populate("approvedBy", "name role");

    res.json({ employee, leaves });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Approve or reject leave
export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const leave = await Leave.findById(id).populate("employee");

    if (!leave) return res.status(404).json({ message: "Leave not found" });

    // ✅ When leave is approved, deduct PLs
    if (status === "Approved") {
      const employee = await Employee.findById(leave.employee._id);

      // calculate number of leave days
      let leaveDays = 0.5;
      if (leave.leaveType === "Full Day") {
        const diff =
          (new Date(leave.endDate) - new Date(leave.startDate)) /
            (1000 * 60 * 60 * 24) +
          1;
        leaveDays = diff;
      }

      // if employee has enough PL
      if (employee.available_PL >= leaveDays) {
        employee.available_PL -= leaveDays;
        leave.isPaid = true;
      } else {
        leave.isPaid = false; // unpaid leave
      }

      await employee.save();
    }

    leave.status = status;
    leave.approvedBy = req.user.id;
    await leave.save();

    res.json({
      message: `Leave ${status.toLowerCase()} successfully`,
      leave,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
