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

// AWS SECRET for firebase json
const AWS = require("aws-sdk");

// Socket
const { createServer } = require("http");
const { Server } = require("socket.io");

//Global Error Handler
const errorHandler = require("./middleware/error.js");

//Routes
const categoryRoutes = require("./routes/category.js");
const userRoutes = require("./routes/user.js");
const companyRoutes = require("./routes/company.js");
const serviceRoutes = require("./routes/service.js");
const feedbackRoutes = require("./routes/feedback.js");
const bannerRoutes = require("./routes/banner.js");
const appointmentRoutes = require("./routes/appointment.js");
const scheduleRoutes = require("./routes/schedule.js");
const artistRoutes = require("./routes/artist.js");
const customerRoutes = require("./routes/customer.js");
const qpayRoutes = require("./routes/qpay.js");
const invoiceRoutes = require("./routes/invoice.js");
const dayoffRoutes = require("./routes/dayoff.js");
const calendarRoutes = require("./routes/calendar.js");
const districtRoute = require("./routes/district.js");
const subDistrictRoute = require("./routes/subdistrict.js");
const areaRoute = require("./routes/area.js");
const direct_paymentRoute = require("./routes/direct_payment.js");
const favRoute = require("./routes/favourite.js");
const journalRoute = require("./routes/journal.js");
const rejectRoute = require("./routes/reject.js");
const mongooseRoute = require("./routes/mongooseChange.js");
const seriesRoute = require("./routes/series.js");
const emailRoute = require("./routes/email.js");
const notRoute = require("./routes/notification.js");

//Server configuration for socket
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//DB connection
connectDB();

app.set("io", io);
//CORS
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

//AWS SECRET
AWS.config.update({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

//FIREBASE
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
app.use("/api/v1/district", districtRoute);
app.use("/api/v1/subdistrict", subDistrictRoute);
app.use("/api/v1/direct-payment", direct_paymentRoute);
app.use("/api/v1/area", areaRoute);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/company", companyRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/service", serviceRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/v1/banner", bannerRoutes);
app.use("/api/v1/appointment", appointmentRoutes);
app.use("/api/v1/schedule", scheduleRoutes);
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
app.use("/api/v1/mongoose", mongooseRoute);
app.use("/api/v1/email", emailRoute);
app.use("/api/v1/series", seriesRoute);

app.use(bodyParser.json({ limit: "300mb" }));
app.use(bodyParser.urlencoded({ limit: "300mb", extended: true }));
app.use("/uploads", express.static(__dirname + "/public/uploads"));

// global алдаа шалгах  function
app.use(errorHandler);

io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("connect", () => {
    console.log("User connected");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });

  // Example of listening for a custom event
  socket.on("message", (data) => {
    console.log("Message received:", data);
    // Emit a message back to the client
    socket.emit("message", "Hello from server");
  });
});

cron.schedule("0 */3 * * *", async () => {
  // console.log("Running the background job every 3 hours...");

  try {
    // const items = await YourModel.find();
    // console.log(`Checked ${items.length} items in YourModel.`);
    // Perform other operations on the model if necessary
  } catch (error) {
    console.error("Error checking the model:", error);
  }
});

require("./controller/cron.js");

// exporess server ajiluulah
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
