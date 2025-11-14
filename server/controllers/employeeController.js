import Employee from "../models/Employee.js";

import User from "../models/User.js";
//  Role-based Employee Fetch
export const getAllEmployees = async (req, res) => {
  try {
    const { role, email, name } = req.user;

    let employees;

    if (role === "Admin") {
      // Admin → all employees
      employees = await Employee.find();
    } else if (role === "Project Manager") {
      // PM → self + employees reporting to them
      employees = await Employee.find({
        $or: [
          { email: email }, // self
          { reportingmanager: name }, // employees under them
        ],
      });
    } else if (role === "Employee") {
      // Employee → only their own profile
      employees = await Employee.find({ email: req.user.email });
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(employees);
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ message: "Server error" });
  }
};

//  Fetch Project Managers

export const getProjectManagers = async (req, res) => {
  try {
    const managers = await Employee.find({ role: "Project Manager" });
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

export const getMyProfile = async (req, res) => {
  try {
    const userEmail = req.user.email;

    const employee = await Employee.findOne({ email: userEmail });

    if (!employee) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(employee);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};
