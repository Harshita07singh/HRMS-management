import express from "express";
import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getProjectManagers,
  getAllEmployees,
} from "../controllers/employeeController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

router.get("/", authMiddleware, getAllEmployees);

router.get("/project-managers", getProjectManagers);
router.post("/", createEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
