import Leave from "../models/Leave.js";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendence.js";
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

//Get all leaves (Admin / PM)
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

// View own leaves (Employee)
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

    //  When leave is approved
    if (status === "Approved") {
      const employee = await Employee.findById(leave.employee._id);

      // Calculate number of leave days
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const totalDays = (end - start) / (1000 * 60 * 60 * 24) + 1; // inclusive count

      let leaveDays = leave.leaveType === "Half Day" ? 0.5 : totalDays;

      // Deduct PLs if applicable
      if (employee.available_PL >= leaveDays) {
        employee.available_PL -= leaveDays;
        leave.isPaid = true;
      } else {
        leave.isPaid = false; // unpaid leave
      }

      await employee.save();

      //  Create or update attendance records for leave days
      const current = new Date(start);
      while (current <= end) {
        const date = new Date(current.toDateString());
        const month = current.getMonth() + 1;
        const year = current.getFullYear();

        await Attendance.findOneAndUpdate(
          { employeeId: employee._id, date },
          {
            $set: {
              attendanceDay: "Leave",
              month,
              year,
            },
          },
          { upsert: true, new: true }
        );

        current.setDate(current.getDate() + 1);
      }
    }

    // Update leave status and approver info
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
