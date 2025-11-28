import Attendance from "../models/Attendence.js";
import Employee from "../models/Employee.js";

export const punchIn = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId)
      return res.status(403).json({ message: "Not an employee account" });

    const employee = await Employee.findById(employeeId);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    const today = new Date();
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const existing = await Attendance.findOne({ employeeId, date });
    if (existing)
      return res.status(400).json({ message: "Already punched in today" });

    const attendance = await Attendance.create({
      employeeId,
      employee_id: employee.employee_id,
      date,
      month: today.getMonth() + 1,
      year: today.getFullYear(),
      punchIn: today,
      attendanceDay: "Present",
    });

    res.status(201).json({ message: "Punched in successfully", attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Punch Out
export const punchOut = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId)
      return res.status(403).json({ message: "Not an employee account" });

    const today = new Date();
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const attendance = await Attendance.findOne({ employeeId, date });
    if (!attendance)
      return res.status(404).json({ message: "No punch-in found for today" });
    if (attendance.punchOut)
      return res.status(400).json({ message: "Already punched out today" });

    attendance.punchOut = today;
    await attendance.save();

    res.json({ message: "Punched out successfully", attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addBreak = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const now = new Date();

    if (now.getHours() >= 18)
      return res.status(400).json({ message: "Cannot add breaks after 6 PM" });

    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const attendance = await Attendance.findOne({ employeeId, date });

    if (!attendance)
      return res.status(404).json({ message: "No attendance found for today" });

    const { start, end } = req.body;
    if (!start || !end)
      return res.status(400).json({ message: "Start and end times required" });

    const startTime = new Date(start);
    const endTime = new Date(end);
    const durationMinutes = Math.floor((endTime - startTime) / (1000 * 60));
    const extended = durationMinutes > 60;

    attendance.breaks.push({
      start: startTime,
      end: endTime,
      durationMinutes,
      extended,
    });
    await attendance.save();

    res.json({
      message: extended
        ? "Break recorded (Extended)"
        : "Break recorded successfully",
      attendance,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get own attendance
export const getMyAttendance = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId)
      return res.status(403).json({ message: "Not an employee account" });

    // Pagination parameters for own attendance
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Attendance.countDocuments({ employeeId });

    const records = await Attendance.find({ employeeId })
      .populate(
        "employeeId",
        "fullname email employee_id role department designation"
      )
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: records,
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

// Admin / Manager / Team Lead - Get all attendance with filters and pagination
export const getAllAttendance = async (req, res) => {
  try {
    const { month, year, date, search } = req.query;
    const query = {};

    // Month & Year filter (existing)
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    //  Date filter (single specific day)
    if (date) {
      const selectedDate = new Date(date);
      query.date = {
        $gte: new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        ),
        $lt: new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate() + 1
        ),
      };
    }

    //  Search filter (by employee fullname or email)
    let employeeFilter = {};
    if (search) {
      const searchRegex = new RegExp(search, "i"); // case-insensitive
      const matchedEmployees = await Employee.find({
        $or: [{ fullname: searchRegex }, { email: searchRegex }],
      }).select("_id");

      const matchedIds = matchedEmployees.map((e) => e._id);
      if (matchedIds.length > 0) {
        employeeFilter.employeeId = { $in: matchedIds };
      } else {
        // No matching employees — return empty array early
        return res.json({
          data: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: 10,
            hasNextPage: false,
            hasPrevPage: false,
          },
        });
      }
    }

    // Combine filters
    const finalQuery = { ...query, ...employeeFilter };

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await Attendance.countDocuments(finalQuery);

    // Fetch data with populated employee details
    const records = await Attendance.find(finalQuery)
      .populate(
        "employeeId",
        "employee_id fullname email department designation role"
      )
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: records,
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
    console.error("Error fetching attendance:", err);
    res.status(500).json({ message: err.message });
  }
};
