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

    //  Send HTML Email
    if (email) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER || "yourname@gmail.com",
          pass: process.env.EMAIL_PASS || "your-app-password",
        },
      });

      // 🧾 Build item rows for email table
      const itemRows = items
        .map(
          (item, index) => `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">${
                index + 1
              }</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${
                item.itemName
              }</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${
                item.quantity
              }</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₹${item.rate.toFixed(
                2
              )}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₹${(
                item.quantity * item.rate
              ).toFixed(2)}</td>
            </tr>
          `
        )
        .join("");

      // 🧠 Email template (HTML)
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 650px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px;">
          <div style="text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 20px;">
            <h1 style="color: #007bff; margin: 0;">INVOICE</h1>
            <p style="margin: 0;">Invoice No: <b>${newInvoiceNo}</b></p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="margin-bottom: 5px;">Billed To:</h3>
            <p style="margin: 0;"><b>${clientName}</b></p>
            <p style="margin: 0;">${address || "Address not provided"}</p>
            <p style="margin: 0;">${email}</p>
            <p style="margin: 0;">${phone || ""}</p>
          </div>

          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 20px;">
            <thead style="background: #f5f5f5;">
              <tr>
                <th style="padding: 8px; border: 1px solid #ddd;">#</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Item</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Qty</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Rate</th>
                <th style="padding: 8px; border: 1px solid #ddd;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <div style="text-align: right;">
            <p><b>Subtotal:</b> ₹${subtotal.toFixed(2)}</p>
            <p><b>GST (18%):</b> ₹${gstAmount.toFixed(2)}</p>
            <h2 style="color: #007bff;">Grand Total: ₹${grandTotal.toFixed(
              2
            )}</h2>
          </div>

          <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 14px; color: #666;">
            <p>Thank you for your business, <b>${clientName}</b>!</p>
            <p>If you have any questions regarding this invoice, feel free to contact us.</p>
            <p style="margin-top: 15px;">— <b>Your Company Name</b><br/>
            123 Business Street, City<br/>
            support@yourcompany.com | +91 98765 43210</p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER || "yourname@gmail.com",
        to: email,
        subject: `Your Invoice ${invoice.invoiceNo} from Our Company`,
        html: htmlBody,
      };

      await transporter.sendMail(mailOptions);
      console.log(`📧 Invoice email sent to ${email}`);
    }

    res.status(201).json({ message: "Invoice created & email sent", invoice });
  } catch (err) {
    console.error("❌ Error creating invoice:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { invoiceNo: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
