import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  employee_id: { type: String, required: true, unique: true },
  fullname: { type: String, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  DOB: { type: Date, required: true },
  email: { type: String, required: true, unique: true },
  mobile_num: { type: String, required: true },
  joining_date: { type: Date, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  reportingmanager: { type: String },

  emplymenttype: {
    type: String,
    enum: ["FullTime", "Intern", "Contract"],
    required: true,
  },
  status: {
    type: String,
    enum: ["Active", "On Notice", "Resigned"],
    default: "Active",
  },
  document: { type: String },
  roles: {
    type: String,
    enum: ["admin", "manager", "employee"],
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;
export const findByIdAndUpdate = Employee.findByIdAndUpdate.bind(Employee);
export const findByIdAndDelete = Employee.findByIdAndDelete.bind(Employee);
