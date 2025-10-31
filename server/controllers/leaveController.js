import Leave from "../models/Leave.js";
import Employee from "../models/Employee.js";

// Apply for leave (Employee)
export const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const employeeId = req.user.employeeId;

    if (!employeeId)
      return res
        .status(403)
        .json({ message: "Only employees can apply for leave" });

    const leave = await Leave.create({
      employee: employeeId,
      leaveType,
      startDate,
      endDate,
      reason,
    });

    res.status(201).json({ message: "Leave applied successfully", leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// View all leaves (Admin or HR)
export const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate("employee", "name email")
      .populate("approvedBy", "name role");
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// View own leaves (Employee)
export const getMyLeaves = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const leaves = await Leave.find({ employee: employeeId });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Approve or reject leave (Admin / Manager)
export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const leave = await Leave.findByIdAndUpdate(
      id,
      { status, approvedBy: req.user.id },
      { new: true }
    );

    if (!leave) return res.status(404).json({ message: "Leave not found" });

    res.json({ message: `Leave ${status.toLowerCase()} successfully`, leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
