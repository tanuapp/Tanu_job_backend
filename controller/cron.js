const cron = require("node-cron");
const invoiceModel = require("../models/invoice");

cron.schedule("* * * * *", async () => {
  console.log("cron job working");

  const expiryTime = 3 * 60 * 1000; 
  const now = Date.now();

  try {
   
    const expiredInvoices = await invoiceModel.find({
      status: "pending",
      createdAt: { $lt: new Date(now - expiryTime) },
    });

    for (const invoice of expiredInvoices) {
      invoice.status = "expired";

      try {
        await invoice.save();
      } catch (saveErr) {
        console.error("Error saving invoice status:", saveErr.message);
      }
    }
  } catch (error) {
    console.error("Error checking expired invoices:", error.message);
  }
});
