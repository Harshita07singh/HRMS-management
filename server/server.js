import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import dotenv from "dotenv";
import leaveRoutes from "./routes/leaveRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import attendanceRoutes from "./routes/attendenceRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import { loadModels } from "./utils/faceRecognition.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
connectDB();

// Initialize face recognition models
(async () => {
  try {
    await loadModels();
  } catch (error) {
    console.error("Failed to load face recognition models:", error);
  }
})();

app.use(
  cors({
    origin: true, // allow all origins for production
    credentials: false, // disable credentials since no cookies are used
  })
);
app.use(express.json());

// route
app.use("/api/auth", authRoutes);

app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payroll", payrollRoutes);
app.get("/", (req, res) => {
  res.send("Hello,  Your server is running 🚀");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
