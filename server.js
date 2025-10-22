// --- Timezone & Core imports ---
process.env.TZ = "Asia/Ulaanbaatar";
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const cron = require("node-cron");
const ntpClient = require("ntp-client");

// --- Middleware & Utils ---
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/error");
const asyncHandler = require("./middleware/asyncHandler");
const connectDB = require("./db");
const initFirebase = require("./firebaseInit");

dotenv.config({ path: ".env" });

// --- Express app ---
const app = express();
app.enable("trust proxy");
app.set("trust proxy", 1);

// --- Multer setup ---
const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files are allowed"), false);
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 300 * 1024 * 1024 },
});

// --- Core system initialization ---
async function syncClock() {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn("⚠️ NTP sync timeout — skipped");
      resolve();
    }, 4000);

    ntpClient.getNetworkTime("pool.ntp.org", 123, (err, date) => {
      clearTimeout(timeout);
      if (err) {
        console.error("❌ NTP sync failed:", err.message);
        return resolve();
      }
      const diff = date.getTime() - Date.now();
      global.clockOffset = diff;
      console.log(`🕓 NTP offset: ${diff} ms`);
      resolve();
    });
  });
}

// --- Initialize Core Systems Once ---
let initialized = false;
async function initCore() {
  if (initialized) return;
  initialized = true;

  await connectDB();
  await syncClock();
  initFirebase();

  console.log("✅ Core systems initialized");
}
initCore();

// --- Middleware ---
app.use(
  cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] })
);
app.options("*", cors());
app.use(express.json({ limit: "300mb" }));
app.use(express.urlencoded({ limit: "300mb", extended: true }));
app.use(logger);

// --- Upload route ---
app.post(
  "/api/v1/upload",
  upload.single("upload"),
  asyncHandler((req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;
    res.status(200).json({ link: fileUrl });
  })
);

// --- API Routes ---
app.use("/api/v1/version", require("./routes/version"));
app.use("/api/v1/option", require("./routes/option"));
app.use("/api/v1/category", require("./routes/category"));
app.use("/api/v1/seriescategory", require("./routes/seriescategory"));
app.use("/api/v1/company", require("./routes/company"));
app.use("/api/v1/user", require("./routes/user"));
app.use("/api/v1/user-role", require("./routes/user_role"));
app.use("/api/v1/service", require("./routes/service"));
app.use("/api/v1/feedback", require("./routes/feedback"));
app.use("/api/v1/banner", require("./routes/banner"));
app.use("/api/v1/tanubanner", require("./routes/tanuBanner"));
app.use("/api/v1/appointment", require("./routes/appointment"));
app.use("/api/v1/schedule", require("./routes/schedule"));
app.use("/api/v1/employee-schedule", require("./routes/employeeSchedule"));
app.use("/api/v1/customer", require("./routes/customer"));
app.use("/api/v1/qpay", require("./routes/qpay"));
app.use("/api/v1/artist", require("./routes/artist"));
app.use("/api/v1/invoice", require("./routes/invoice"));
app.use("/api/v1/dayoff", require("./routes/dayoff"));
app.use("/api/v1/calendar", require("./routes/calendar"));
app.use("/api/v1/favourite", require("./routes/favourite"));
app.use("/api/v1/journal", require("./routes/journal"));
app.use("/api/v1/reject", require("./routes/reject"));
app.use("/api/v1/notification", require("./routes/notification"));
app.use("/api/v1/attendance", require("./routes/timelog"));
app.use("/api/v1/mongoose", require("./routes/mongooseChange"));
app.use("/api/v1/series", require("./routes/series"));
app.use("/api/v1/bg", require("./routes/bgremove"));
app.use("/api/v1/story", require("./routes/story"));
app.use("/api/v1/gallery", require("./routes/gallery"));
app.use("/api/v1/direct-payment", require("./routes/direct_payment"));
app.use(
  "/api/v1/company-artist-request",
  require("./routes/company_artist_request")
);
app.use("/api/v1/comment", require("./routes/comment"));
app.use("/api/v1/agent", require("./routes/agent"));
app.use("/api/v1/contract", require("./routes/onlineContractRouter"));
app.use("/api/v1/contract-render", require("./routes/contractRender"));
app.use("/api/v1/dan", require("./routes/dan"));
app.use("/api/v1/blacklist", require("./routes/blackList"));
app.use("/api/v1/freelancer", require("./routes/freelancer"));
app.use("/api/v1/order", require("./routes/order"));
app.use("/api/v1/wallet", require("./routes/wallet"));

// --- Static uploads folder (for local only) ---
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// --- Default route for testing ---
app.get("/", (req, res) => {
  res
    .status(200)
    .json({ success: true, message: "Tanu Job API is running ✅" });
});

// --- Error handler ---
app.use(errorHandler);

// --- Cron job (disabled on Vercel) ---
if (process.env.VERCEL !== "1") {
  cron.schedule("0 */3 * * *", async () => {
    try {
      console.log("🕒 Running cron job every 3 hours...");
    } catch (error) {
      console.error("Error in cron job:", error);
    }
  });
  require("./controller/cron");
}

// --- Start locally, export for Vercel ---
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 9000;
  app.listen(PORT, async () => {
    await initCore();
    console.log(`✅ Server running locally on port ${PORT}`);
  });
}

module.exports = app;
