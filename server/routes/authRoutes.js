import express from "express";
import { register, login } from "../controllers/authController.js";
// import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
// router.get("/:id", protect, getUser);

export default router;
