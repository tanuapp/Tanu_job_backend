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
var serviceAccount = require("./tanu-app-928a8-firebase-adminsdk-mrr1i-28babc6869.json");

// Socket
const { createServer } = require("http");
const { Server } = require("socket.io");

// Global Error Handler
const errorHandler = require("./middleware/error.js");

// Routes
const onlineContractRouter = require("./routes/onlineContractRouter.js");
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
const artistRoutes = require("./routes/artist.js");
const personRoutes = require("./routes/person.js");
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
const emailRoute = require("./routes/email.js");
const notRoute = require("./routes/notification.js");
const bgRoute = require("./routes/bgremove.js");
const storyRoute = require("./routes/story.js");
const galleryRoute = require("./routes/gallery.js");
const userRoleRoute = require("./routes/user_role.js");
const companyArtistRequestRoute = require("./routes/company_artist_request.js");
const commentRoute = require("./routes/comment.js");
const agentRoute = require("./routes/agent.js");

// Multer setup
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 300 * 1024 * 1024 }, // Set max file size limit (300MB)
});

// Server configuration for socket
const app = express();
app.enable("trust proxy");
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// DB connection
connectDB();

app.set("io", io);

// CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options(cors());
app.use(logger);
app.use(express.json());

// FIREBASE
async function initializeFirebase() {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("Firebase initialized successfully");
  } catch (err) {
    console.error("Error retrieving secret or initializing Firebase:", err);
  }
}

initializeFirebase();
app.use("/api/v1/option", optionRouter);
app.use("/api/v1/contract", onlineContractRouter);
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
app.use("/api/v1/customer", customerRoutes);
app.use("/api/v1/qpay", qpayRoutes);
app.use("/api/v1/artist", artistRoutes);
app.use("/api/v1/person", personRoutes);
app.use("/api/v1/invoice", invoiceRoutes);
app.use("/api/v1/dayoff", dayoffRoutes);
app.use("/api/v1/calendar", calendarRoutes);
app.use("/api/v1/favourite", favRoute);
app.use("/api/v1/journal", journalRoute);
app.use("/api/v1/reject", rejectRoute);
app.use("/api/v1/notification", notRoute);
app.use("/api/v1/mongoose", mongooseRoute);
app.use("/api/v1/email", emailRoute);
app.use("/api/v1/series", seriesRoute);
app.use("/api/v1/bg", bgRoute);
app.use("/api/v1/story", storyRoute);
app.use("/api/v1/gallery", galleryRoute);
app.use("/api/v1/direct-payment", direct_paymentRoute);
app.use("/api/v1/company-artist-request", companyArtistRequestRoute);
app.use("/api/v1/comment", commentRoute);
app.use("/api/v1/agent", agentRoute);

app.use(bodyParser.json({ limit: "300mb" }));
app.use(bodyParser.urlencoded({ limit: "300mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// File upload
app.post("/api/v1/upload-pdf", upload.single("pdfFile"), (req, res) => {
  try {
    res.status(200).json({
      message: "File uploaded successfully",
      file: req.file,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Global error handler
app.use(errorHandler);

io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("connect", () => {
    console.log("User connected");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

  socket.on("message", (data) => {
    console.log("Message received:", data);
    socket.emit("message", "Hello from server");
  });
});

cron.schedule("0 */3 * * *", async () => {
  // console.log("Running the background job every 3 hours...");

  try {
    // const items = await YourModel.find();
    // console.log(`Checked ${items.length} items in YourModel.`);
  } catch (error) {
    console.error("Error checking the model:", error);
  }
});

require("./controller/cron.js");

// Express server running
const server = httpServer.listen(
  process.env.PORT,
  console.log(`Express server is running on port ${process.env.PORT}`)
);

process.on("unhandledRejection", (err, promise) => {
  console.log(`Unhandled rejection error: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = admin;
