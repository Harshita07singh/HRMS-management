import Attendance from "../models/Attendence.js";
import Employee from "../models/Employee.js";
import {
  getFaceEmbedding,
  compareFaces,
  getFaceSimilarityScore,
} from "../utils/faceRecognition.js";

// Punch In with face recognition
export const punchIn = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    if (!req.user.employeeId) {
      return res.status(403).json({ message: "Not an employee account" });
    }

    const employee = await Employee.findById(req.user.employeeId);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if already punched in today
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    const existingAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    if (existingAttendance && existingAttendance.punchIn) {
      return res.status(400).json({ message: "Already punched in today" });
    }

    // Extract face embedding from uploaded image
    const currentEmbedding = await getFaceEmbedding(req.file.path);
    if (!currentEmbedding) {
      return res.status(400).json({
        message: "No face detected in image. Please ensure your face is clear.",
      });
    }

    let similarityScore = 0;
    let isMatch = false;

    // Check if employee has face enrollment
    if (!employee.faceEmbedding || employee.faceEmbedding.length === 0) {
      // First-time face enrollment during punch-in
      employee.faceEmbedding = currentEmbedding;
      await employee.save();

      // For first punch-in, skip verification since this is the enrollment
      isMatch = true;
      similarityScore = 100; // Perfect match for enrollment
    } else {
      // Compare faces for verification
      similarityScore = getFaceSimilarityScore(
        employee.faceEmbedding,
        currentEmbedding
      );
      isMatch = compareFaces(employee.faceEmbedding, currentEmbedding, 0.45);

      if (!isMatch) {
        return res.status(403).json({
          message: `Face verification failed. Similarity: ${similarityScore.toFixed(
            2
          )}%. Please try again.`,
          similarityScore: similarityScore.toFixed(2),
        });
      }
    }

    // Create or update attendance record
    let attendance = existingAttendance;
    if (!attendance) {
      attendance = new Attendance({
        employeeId: employee._id,
        employee_id: employee.employee_id,
        date: startOfDay,
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        punchIn: today,
        punchInVerified: true,
        punchInSimilarityScore: similarityScore,
        attendanceDay: "Present",
      });
    } else {
      attendance.punchIn = today;
      attendance.punchInVerified = true;
      attendance.punchInSimilarityScore = similarityScore;
      attendance.attendanceDay = "Present";
    }

    await attendance.save();

    res.status(200).json({
      message: `Punch-In Successful! Face match: ${similarityScore.toFixed(
        2
      )}%`,
      attendance,
      faceVerification: {
        verified: true,
        similarityScore: similarityScore.toFixed(2),
        timestamp: new Date(),
      },
    });
  } catch (err) {
    console.error("Punch-in error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Punch Out with face recognition
export const punchOut = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    if (!req.user.employeeId) {
      return res.status(403).json({ message: "Not an employee account" });
    }

    const employee = await Employee.findById(req.user.employeeId);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    if (!attendance) {
      return res.status(404).json({ message: "No punch-in found for today" });
    }

    if (attendance.punchOut) {
      return res.status(400).json({ message: "Already punched out today" });
    }

    // Extract face embedding from uploaded image
    const currentEmbedding = await getFaceEmbedding(req.file.path);
    if (!currentEmbedding) {
      return res.status(400).json({
        message: "No face detected in image. Please ensure your face is clear.",
      });
    }

    let similarityScore = 0;
    let isMatch = false;

    // Check if employee has face enrollment
    if (!employee.faceEmbedding || employee.faceEmbedding.length === 0) {
      // First-time face enrollment during punch-out (edge case)
      employee.faceEmbedding = currentEmbedding;
      await employee.save();

      // For first interaction, skip verification since this is the enrollment
      isMatch = true;
      similarityScore = 100; // Perfect match for enrollment
    } else {
      // Compare faces for verification
      similarityScore = getFaceSimilarityScore(
        employee.faceEmbedding,
        currentEmbedding
      );
      isMatch = compareFaces(employee.faceEmbedding, currentEmbedding, 0.45);

      if (!isMatch) {
        return res.status(403).json({
          message: `Face verification failed. Similarity: ${similarityScore.toFixed(
            2
          )}%. Please try again.`,
          similarityScore: similarityScore.toFixed(2),
        });
      }
    }

    // Update punch out
    attendance.punchOut = today;
    attendance.punchOutVerified = true;
    attendance.punchOutSimilarityScore = similarityScore;

    // Calculate total work minutes
    const diffMs = attendance.punchOut - attendance.punchIn;
    const totalBreakMinutes = attendance.breaks.reduce(
      (sum, br) => sum + (br.durationMinutes || 0),
      0
    );
    const totalWorkMinutes =
      Math.floor(diffMs / (1000 * 60)) - totalBreakMinutes;

    attendance.totalWorkMinutes = Math.max(0, totalWorkMinutes);

    await attendance.save();

    res.json({
      message: `Punch-Out Successful! Face match: ${similarityScore.toFixed(
        2
      )}%`,
      attendance,
      faceVerification: {
        verified: true,
        similarityScore: similarityScore.toFixed(2),
        timestamp: new Date(),
      },
    });
  } catch (err) {
    console.error("Punch-out error:", err);
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
