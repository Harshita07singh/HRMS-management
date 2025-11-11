// models/Attendance.js
import mongoose from "mongoose";

const breakSchema = new mongoose.Schema({
  start: Date,
  end: Date,
  durationMinutes: Number,
  extended: { type: Boolean, default: false },
});

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employee_id: { type: String, required: true },
    date: { type: Date, required: true },
    month: Number,
    year: Number,
    punchIn: Date,
    punchOut: Date,
    attendanceDay: {
      type: String,
      enum: [
        "Present",
        "Absent",
        "Half Day",
        "Work From Home",
        "Leave",
        "Holiday",
      ],
      default: "Absent",
    },
    totalWorkMinutes: { type: Number, default: 0 },
    breaks: [breakSchema], // 👈 Added
  },
  { timestamps: true }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
