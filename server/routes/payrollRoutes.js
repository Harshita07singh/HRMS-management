// routes/payrollRoutes.js
import express from "express";
import {
  generatePayroll,
  listPayrolls,
  getPayroll,
} from "../controllers/payrollController.js";
import {
  authMiddleware,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Only Admin can create payrolls (you can add HR role if present)
router.post(
  "/generate",
  authMiddleware,
  authorizeRoles("Admin"),
  generatePayroll
);

// Admin/Manager can list payrolls
router.get(
  "/",
  authMiddleware,
  authorizeRoles("Admin", "Project Manager", "Team Lead"),
  listPayrolls
);

router.get(
  "/:id",
  authMiddleware,
  authorizeRoles("Admin", "Project Manager", "Team Lead"),
  getPayroll
);

export default router;
