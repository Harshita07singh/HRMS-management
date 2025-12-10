import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import attendanceRoutes from "./routes/attendenceRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import { loadModels } from "./utils/faceRecognition.js";

const app = express();
const PORT = process.env.PORT || 4000;

// DB
connectDB();

// Load models
(async () => {
  try {
    await loadModels();
  } catch (error) {
    console.error("Model loading error:", error);
  }
})();

// CORS
app.use(
  cors({
    origin: [
      "https://hrms-management-frontend.onrender.com",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

// Handle preflight OPTIONS requests
app.options("*", (req, res) => {
  res.sendStatus(204);
});

app.use(express.json());

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payroll", payrollRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

// START SERVER
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
