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

router.post(
  "/apply",
  authMiddleware,
  authorizeRoles("Employee", "Project Manager"),
  applyLeave
);
router.get(
  "/my-leaves",
  authMiddleware,
  authorizeRoles("Employee", "Project Manager"),
  getMyLeaves
);

router.get(
  "/",
  authMiddleware,
  authorizeRoles("Admin", "Project Manager"),
  getAllLeaves
);
router.patch(
  "/:id/status",
  authMiddleware,
  authorizeRoles("Admin", "Project Manager"),
  updateLeaveStatus
);

export default router;
