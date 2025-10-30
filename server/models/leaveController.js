// controllers/leaveController.js
import Leave from "../models/leaveModel.js";
import User from "../models/User.js";

const computeNoOfDays = ({ leaveType, startDate, endDate }) => {
  if (leaveType === "Half Day") return 0.5;
  const s = new Date(startDate);
  s.setHours(0, 0, 0, 0);
  const e = new Date(endDate);
  e.setHours(0, 0, 0, 0);
  const diffMs = e - s;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 0;
};

// Apply leave (protected)
export const applyLeave = async (req, res) => {
  try {
    const user = req.user;
    const { typeOfLeave, leaveType, startDate, endDate, message } = req.body;

    if (!startDate)
      return res.status(400).json({ message: "startDate required" });
    const sd = new Date(startDate);
    const ed =
      leaveType === "Half Day" ? new Date(startDate) : new Date(endDate);
    const managerId = user.managerId || null;

    const noOfLeaveDays = computeNoOfDays({
      leaveType,
      startDate: sd,
      endDate: ed,
    });

    const leave = await Leave.create({
      employeeId: String(user._id),
      employeeName: user.name,
      managerId,
      typeOfLeave,
      leaveType,
      startDate: sd,
      endDate: ed,
      noOfLeaveDays,
      message,
      status: "Pending",
    });

    res.status(201).json({ message: "Leave applied", leave });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get leaves (with pagination, search, filters)
export const getLeaves = async (req, res) => {
  try {
    const user = req.user;
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      fromDate,
      toDate,
    } = req.query;
    const q = {};

    // role-based base query
    if (user.role === "employee") q.employeeId = String(user._id);
    else if (user.role === "manager") q.managerId = String(user._id);
    // admin: no restriction

    if (status) q.status = status;
    if (search) {
      q.$or = [
        { employeeName: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { typeOfLeave: { $regex: search, $options: "i" } },
      ];
    }
    if (fromDate) q.startDate = { $gte: new Date(fromDate) };
    if (toDate)
      q.endDate = q.endDate
        ? { ...q.endDate, $lte: new Date(toDate) }
        : { $lte: new Date(toDate) };

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Leave.countDocuments(q);
    const leaves = await Leave.find(q)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    res.json({ total, page: Number(page), limit: Number(limit), data: leaves });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update status (manager/admin)
export const updateLeaveStatus = async (req, res) => {
  try {
    const user = req.user;
    const { status } = req.body;
    if (!["Pending", "Approved", "Rejected"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Not found" });

    if (
      user.role === "manager" &&
      String(leave.managerId) !== String(user._id)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    leave.status = status;
    await leave.save();
    res.json({ message: "Status updated", leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
