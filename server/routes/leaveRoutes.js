import express from "express";
import {
  applyLeave,
  getAllLeaves,
  getMyLeaves,
  updateLeaveStatus,
} from "../controllers/leaveController.js";
import {
  authMiddleware,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// 🧑‍🏭 Employee routes
router.post("/apply", authMiddleware, authorizeRoles("Employee"), applyLeave);
router.get(
  "/my-leaves",
  authMiddleware,
  authorizeRoles("Employee"),
  getMyLeaves
);

// 👩‍💼 Admin/HR routes
router.get("/", authMiddleware, authorizeRoles("Admin", "HR"), getAllLeaves);
router.patch(
  "/:id/status",
  authMiddleware,
  authorizeRoles("Admin", "HR"),
  updateLeaveStatus
);

export default router;
