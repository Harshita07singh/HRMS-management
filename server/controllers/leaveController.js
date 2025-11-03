import Leave from "../models/Leave.js";
import Employee from "../models/Employee.js";

//  Apply for leave (Employee)
export const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason, employeeid } = req.body;
    const employeeId = req.user.employeeId;

    if (!employeeId)
      return res
        .status(403)
        .json({ message: "Only employees can apply for leave" });

    const leave = await Leave.create({
      employee: employeeId,
      employeeid,
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

//  Get all leaves (Role-based)
export const getAllLeaves = async (req, res) => {
  try {
    const { role, name, email } = req.user;
    let leaves = [];

    if (role === "Admin") {
      //  Admin sees all leaves
      leaves = await Leave.find()
        .populate(
          "employee",
          "employee_id fullname email role reportingmanager"
        )
        .populate("approvedBy", "name role");
    } else if (role === "Project Manager") {
      //  Project Manager sees only own + team members' leaves
      const manager = await Employee.findOne({ email });
      if (!manager)
        return res.status(404).json({ message: "Manager record not found" });

      // Find employees who report to this manager
      const team = await Employee.find({
        reportingmanager: manager.fullname,
      }).select("_id");

      const teamIds = team.map((t) => t._id);

      leaves = await Leave.find({
        $or: [{ employee: { $in: teamIds } }, { "employee.email": email }],
      })
        .populate(
          "employee",
          "employee_id fullname email role reportingmanager"
        )
        .populate("approvedBy", "name role");
    } else if (role === "Employee") {
      //  Employee sees only their own leaves
      const employee = await Employee.findOne({ email });
      if (!employee)
        return res.status(404).json({ message: "Employee not found" });

      leaves = await Leave.find({ employee: employee._id })
        .populate(
          "employee",
          "employee_id fullname email role reportingmanager"
        )
        .populate("approvedBy", "name role");
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(leaves);
  } catch (err) {
    console.error("Error fetching leaves:", err);
    res.status(500).json({ message: err.message });
  }
};

//  View own leaves (Employee)
export const getMyLeaves = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;

    const leaves = await Leave.find({ employee: employeeId })
      .populate("employee", "employee_id fullname email role")
      .populate("approvedBy", "name role");

    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  Approve or Reject Leave (Admin / PM)
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
