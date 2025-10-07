process.env.TZ = "Asia/Ulaanbaatar";
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const logger = require("./middleware/logger.js");
dotenv.config({ path: ".env" });
const connectDB = require("./db");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const cron = require("node-cron");
const path = require("path");
const asyncHandler = require("./middleware/asyncHandler");

const { createServer } = require("http");
const { Server } = require("socket.io");
const errorHandler = require("./middleware/error.js");

// Routes
const versionRoute = require("./routes/version.js");
const optionRouter = require("./routes/option.js");
const categoryRoutes = require("./routes/category.js");
const seriescategoryRoutes = require("./routes/seriescategory.js");
const userRoutes = require("./routes/user.js");
const companyRoutes = require("./routes/company.js");
const serviceRoutes = require("./routes/service.js");
const feedbackRoutes = require("./routes/feedback.js");
const bannerRoutes = require("./routes/banner.js");
const tanuBannerRoutes = require("./routes/tanuBanner");
const appointmentRoutes = require("./routes/appointment.js");
const scheduleRoutes = require("./routes/schedule.js");
const employeeScheduleRoutes = require("./routes/employeeSchedule.js");
const artistRoutes = require("./routes/artist.js");
const customerRoutes = require("./routes/customer.js");
const qpayRoutes = require("./routes/qpay.js");
const invoiceRoutes = require("./routes/invoice.js");
const dayoffRoutes = require("./routes/dayoff.js");
const calendarRoutes = require("./routes/calendar.js");
const direct_paymentRoute = require("./routes/direct_payment.js");
const favRoute = require("./routes/favourite.js");
const journalRoute = require("./routes/journal.js");
const rejectRoute = require("./routes/reject.js");
const mongooseRoute = require("./routes/mongooseChange.js");
const seriesRoute = require("./routes/series.js");
const notRoute = require("./routes/notification.js");
const bgRoute = require("./routes/bgremove.js");
const storyRoute = require("./routes/story.js");
const galleryRoute = require("./routes/gallery.js");
const userRoleRoute = require("./routes/user_role.js");
const companyArtistRequestRoute = require("./routes/company_artist_request.js");
const commentRoute = require("./routes/comment.js");
const agentRoute = require("./routes/agent.js");
const onlineContractRouter = require("./routes/onlineContractRouter.js");
const onlineContractRender = require("./routes/contractRender.js");
const danAuthRoute = require("./routes/dan.js");
const blackListRoute = require("./routes/blackList.js");
const attendanceRoute = require("./routes/timelog.js");
const freelancerRoute = require("./routes/freelancer.js");
const orderRoute = require("./routes/order.js");

// Multer setup
const multer = require("multer");
const initFirebase = require("./firebaseInit.js");

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

// --- Express app ---
const app = express();
app.enable("trust proxy");
app.set("trust proxy", 1);

// --- Init ---
connectDB();
initFirebase();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());
app.use(logger);
app.use(bodyParser.json({ limit: "300mb" }));
app.use(bodyParser.urlencoded({ limit: "300mb", extended: true }));

// --- Upload route ---
app.post(
  "/api/v1/upload",
  upload.single("upload"),
  asyncHandler((req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const fileUrl = `https://api.tanusoft.mn/uploads/${req.file.filename}`;
    res.status(200).json({ link: fileUrl });
  })
);

// --- Routes ---
app.use("/api/v1/version", versionRoute);
app.use("/api/v1/option", optionRouter);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/seriescategory", seriescategoryRoutes);
app.use("/api/v1/company", companyRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/user-role", userRoleRoute);
app.use("/api/v1/service", serviceRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/v1/banner", bannerRoutes);
app.use("/api/v1/tanubanner", tanuBannerRoutes);
app.use("/api/v1/appointment", appointmentRoutes);
app.use("/api/v1/schedule", scheduleRoutes);
app.use("/api/v1/employee-schedule", employeeScheduleRoutes);
app.use("/api/v1/customer", customerRoutes);
app.use("/api/v1/qpay", qpayRoutes);
app.use("/api/v1/artist", artistRoutes);
app.use("/api/v1/invoice", invoiceRoutes);
app.use("/api/v1/dayoff", dayoffRoutes);
app.use("/api/v1/calendar", calendarRoutes);
app.use("/api/v1/favourite", favRoute);
app.use("/api/v1/journal", journalRoute);
app.use("/api/v1/reject", rejectRoute);
app.use("/api/v1/notification", notRoute);
app.use("/api/v1/attendance", attendanceRoute);
app.use("/api/v1/mongoose", mongooseRoute);
app.use("/api/v1/series", seriesRoute);
app.use("/api/v1/bg", bgRoute);
app.use("/api/v1/story", storyRoute);
app.use("/api/v1/gallery", galleryRoute);
app.use("/api/v1/direct-payment", direct_paymentRoute);
app.use("/api/v1/company-artist-request", companyArtistRequestRoute);
app.use("/api/v1/comment", commentRoute);
app.use("/api/v1/agent", agentRoute);
app.use("/api/v1/contract", onlineContractRouter);
app.use("/api/v1/contract-render", onlineContractRender);
app.use("/api/v1/dan", danAuthRoute);
app.use("/api/v1/blacklist", blackListRoute);
app.use("/api/v1/freelancer", freelancerRoute);
app.use("/api/v1/order", orderRoute);
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// --- Global error handler ---
app.use(errorHandler);

// --- Cron jobs ---
cron.schedule("0 */3 * * *", async () => {
  try {
    console.log("Running cron job every 3 hours...");
  } catch (error) {
    console.error("Error in cron:", error);
  }
});

require("./controller/cron.js");

app.listen(process.env.PORT, () =>
  console.log(`Server is running on port ${process.env.PORT}`)
);

module.exports = app;
