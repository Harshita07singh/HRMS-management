import express from "express";
import {
  punchIn,
  punchOut,
  addBreak,
  getMyAttendance,
  getAllAttendance,
} from "../controllers/attendenceController.js";
import {
  authMiddleware,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/punch-in",
  authMiddleware,
  authorizeRoles("Employee", "Project Manager", "Team Lead"),
  punchIn
);
router.post(
  "/punch-out",
  authMiddleware,
  authorizeRoles("Employee", "Project Manager", "Team Lead"),
  punchOut
);
router.post(
  "/add-break",
  authMiddleware,
  authorizeRoles("Employee", "Project Manager", "Team Lead"),
  addBreak
);

router.get(
  "/my",
  authMiddleware,
  authorizeRoles("Employee", "Project Manager", "Team Lead"),
  getMyAttendance
);
router.get(
  "/",
  authMiddleware,
  authorizeRoles("Admin", "Project Manager", "Team Lead"),
  getAllAttendance
);

export default router;
