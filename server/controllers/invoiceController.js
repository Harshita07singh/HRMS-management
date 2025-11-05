import Invoice from "../models/Invoice.js";
import nodemailer from "nodemailer";

export const createInvoice = async (req, res) => {
  try {
    //  Get the latest invoice number
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });

    let newInvoiceNo = "LT001";
    if (lastInvoice) {
      const lastNo = parseInt(lastInvoice.invoiceNo.replace("LT", ""), 10);
      const nextNo = (lastNo + 1).toString().padStart(3, "0");
      newInvoiceNo = `LT${nextNo}`;
    }

    //  Calculate totals
    const { clientName, email, phone, address, items } = req.body;
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0
    );
    const gstAmount = (subtotal * 18) / 100;
    const grandTotal = subtotal + gstAmount;

    //  Save to database
    const invoice = await Invoice.create({
      invoiceNo: newInvoiceNo,
      clientName,
      email,
      phone,
      address,
      items,
      gst: 18,
      grandTotal,
    });

    //  Send email (using your Nodemailer snippet)
    if (email) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER || "yourname@gmail.com", // put your email
          pass: process.env.EMAIL_PASS || "your-app-password", // 16-char Gmail app password
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER || "yourname@gmail.com",
        to: email,
        subject: `Invoice ${invoice.invoiceNo} Created`,
        text: `Dear ${clientName},

Your invoice ${invoice.invoiceNo} has been created successfully.

Subtotal: ₹${subtotal.toFixed(2)}
GST (18%): ₹${gstAmount.toFixed(2)}
Grand Total: ₹${grandTotal.toFixed(2)}

Thank you for your business!
`,
      };

      await transporter.sendMail(mailOptions);
      console.log(` Email sent to ${email}`);
    }

    res.status(201).json({ message: "Invoice created & email sent", invoice });
  } catch (err) {
    console.error(" Error creating invoice:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
