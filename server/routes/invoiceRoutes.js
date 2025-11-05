import express from "express";
import {
  createInvoice,
  getInvoices,
} from "../controllers/invoiceController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a new invoice
router.post("/", authMiddleware, createInvoice);

// Get all invoices
router.get("/", authMiddleware, getInvoices);

export default router;
