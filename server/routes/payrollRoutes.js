import express from "express";
import {
  generatePayroll,
  getAllPayrolls,
} from "../controllers/payrollController.js";
import {
  authMiddleware,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin / PM can generate and view payroll
router.post(
  "/generate",
  authMiddleware,
  authorizeRoles("Admin", "Project Manager"),
  generatePayroll
);

router.get(
  "/",
  authMiddleware,
  authorizeRoles("Admin", "Project Manager"),
  getAllPayrolls
);

export default router;
