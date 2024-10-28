const cron = require("node-cron");
const invoiceModel = require("../models/invoice");

cron.schedule("* * * * *", async () => {
  console.log("cron job working");
  const expiryTime = 3 * 60 * 1000;
  const now = Date.now();

  try {
    // Find unpaid invoices older than 3 minutes
    const expiredInvoices = await invoiceModel.find({
      status: "pending",
      createdAt: { $lt: new Date(now - expiryTime) },
    });

    for (const invoice of expiredInvoices) {
      invoice.status = "expired";
      await invoice.save();
    }
  } catch (error) {
    console.error("Error checking expired invoices:", error);
  }
});
