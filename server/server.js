import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import dotenv from "dotenv";
import leaveRoutes from "./routes/leaveRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
connectDB();

app.use(
  cors({
    origin: "http://localhost:3000", // your React app URL
    credentials: true, // allow cookies / tokens
  })
);
app.use(express.json());

// route
app.use("/api/auth", authRoutes);

app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/invoices", invoiceRoutes);
app.get("/", (req, res) => {
  res.send("Hello,  Your server is running 🚀");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
