import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  description: String,
  quantity: Number,
  rate: Number,
  price: Number,
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true },
    clientName: String,
    email: String,
    phone: String,
    address: String,
    items: [itemSchema],
    gst: Number,
    grandTotal: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
