import Employee from "../models/Employee.js";

// Get all employees
export const getAllEmployees = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { role, name, email } = req.user;
    console.log("Logged-in user:", req.user);
    let employees;
    if (role === "Admin") {
      employees = await Employee.find();
    } else if (role === "Project Manager") {
      employees = await Employee.find({ reportingmanager: name });
    } else {
      // Other users see only their own record
      employees = await Employee.find({ email });
    }

    res.status(200).json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// export const getAllEmployees = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     const { role, employeeId, email } = req.user;
//     let employees;

//     if (role === "Admin") {
//       employees = await Employee.find().populate(
//         "reportingmanager",
//         "fullname email"
//       );
//     } else if (
//       role === "Project Manager" &&
//       reportingmanager?.role === "Project Manager"
//     ) {
//       if (!employeeId) {
//         return res
//           .status(400)
//           .json({ message: "Employee record not found for this user" });
//       }

//       const pmId = new mongoose.Types.ObjectId(employeeId);

//       employees = await Employee.find({
//         $or: [{ reportingmanager: pmId }, { _id: pmId }],
//       }).populate("reportingmanager", "fullname email");
//     } else {
//       employees = await Employee.find({ email }).populate(
//         "reportingmanager",
//         "fullname email"
//       );
//     }

//     return res.status(200).json(employees);
//   } catch (err) {
//     console.error("Error fetching employees:", err);
//     return res.status(500).json({ error: err.message });
//   }
// };

export const getProjectManagers = async (req, res) => {
  try {
    const managers = await Employee.find({ roles: "Project Manager" });
    res.status(200).json(managers);
  } catch (error) {
    console.error("Error fetching project managers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create

export const createEmployee = async (req, res) => {
  try {
    const employee = new Employee(req.body);
    const saved = await employee.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update
export const updateEmployee = async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ error: "Employee not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete
export const deleteEmployee = async (req, res) => {
  try {
    const deleted = await Employee.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Employee not found" });
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
