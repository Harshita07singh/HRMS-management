import express from "express";
import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getProjectManagers,
  getAllEmployees,
  getMyProfile,
} from "../controllers/employeeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getAllEmployees);
router.get("/project-managers", getProjectManagers);
router.post("/", createEmployee);
router.put("/:id", authMiddleware, updateEmployee);
router.delete("/:id", authMiddleware, deleteEmployee);
router.get("/me", authMiddleware, getMyProfile);
export default router;
