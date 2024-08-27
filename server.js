const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const logger = require("./middleware/logger.js");
dotenv.config({ path: "./config/config.env" });
const connectDB = require("./db");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const AWS = require("aws-sdk");
const { createServer } = require("http"); // Import createServer from http module
const { Server } = require("socket.io"); // Import Server from socket.io

//router routes import

const districtRoute = require("./routes/district.js");
const subDistrictRoute = require("./routes/subdistrict.js");
const areaRoute = require("./routes/area.js");
//
const userRoutes = require("./routes/user");
const newJournalRoutes = require("./routes/newJournal.js");
const serviceRoute = require("./routes/serviceRoute.js");
const categoryRoute = require("./routes/categoryRoute.js");
const subcategoryRoute = require("./routes/subcategoryRoute.js");
const itemRoute = require("./routes/itemRoute.js");
const optRoute = require("./routes/optRoute.js");
const customerRoutes = require("./routes/customerRoute.js");
const invoiceRoute = require("./routes/invoiceRoute.js");
const qpayRoute = require("./routes/qpayRoute.js");
const companyRoute = require("./routes/companyRoute.js");
const artistRoute = require("./routes/artistRoute.js");
const customerOrderRoute = require("./routes/customerOrderRoute.js");
const calendarRoute = require("./routes/calendarRoute.js");
const locationRoute = require("./routes/locationRoute.js");
const journalRoute = require("./routes/journal.js");
const reelRoute = require("./routes/reel.js");
const journalTypeRoute = require("./routes/journalType.js");
const journalistTypeRoute = require("./routes/journalist.js");
const munkhuRoute = require("./routes/test-munhu.route.js");
const errorHandler = require("./middleware/error.js");
const upload = require("./middleware/fileUpload.js");
const asyncHandler = require("./middleware/asyncHandler.js");

const app = express();
const httpServer = createServer(app); // Create the HTTP server using Express
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

connectDB();
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

AWS.config.update({
  region: "ap-south-1",
  credentials: {
    // accessKeyId: "AKIAXEVXYPLF5W5B6EHK",

    accessKeyId: process.env.AWS_ACCESS_KEY,
    // secretAccessKey: "vG1NG4r2Nx7ZCQmYRQPdpF/Fz2AOddT8/NZyuFJY",
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const secretsManager = new AWS.SecretsManager();
const secret_name = "tanu/order";

async function initializeFirebase() {
  try {
    const data = await secretsManager
      .getSecretValue({ SecretId: secret_name })
      .promise();

    if (data.SecretString) {
      const serviceAccount = JSON.parse(data.SecretString);

      // Initialize Firebase Admin SDK
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log("Firebase initialized successfully");
    }
  } catch (err) {
    console.error("Error retrieving secret or initializing Firebase:", err);
  }
}

// Initialize Firebase after fetching the secret
initializeFirebase();

app.post(
  "/api/v1/upload",
  upload.single("upload"), // Use "upload" as field name to match CKEditor simpleUpload default
  asyncHandler((req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // File has been uploaded, construct the file URL
    const fileUrl = `/uploads/${req.file.filename}`;

    // Send the URL back to CKEditor in the expected format
    res.status(200).json({
      url: fileUrl,
    });
  })
);
// api handaltuud
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/customer", customerRoutes);
app.use("/api/v1/service", serviceRoute);
app.use("/api/v1/category", categoryRoute);
app.use("/api/v1/subcategory", subcategoryRoute);
app.use("/api/v1/opt", optRoute);
app.use("/api/v1/item", itemRoute);
app.use("/api/v1/invoice", invoiceRoute);
app.use("/api/v1/item", itemRoute);
app.use("/api/v1/qpay", qpayRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/artist", artistRoute);
app.use("/api/v1/calendar", calendarRoute);
app.use("/api/v1/location", locationRoute);
app.use("/api/v1/customerOrder", customerOrderRoute);
app.use("/api/v1/journaltype", journalTypeRoute);
app.use("/api/v1/reel", reelRoute);

app.use("/api/v1/journal", journalRoute);
app.use("/api/v1/journalist", journalistTypeRoute);
app.use("/api/v1/munku", munkhuRoute);
app.use("/api/v1/newjournal", newJournalRoutes);
app.use("/api/v1/district", districtRoute);
app.use("/api/v1/subdistrict", subDistrictRoute);
app.use("/api/v1/area", areaRoute);

app.use(bodyParser.json({ limit: "300mb" }));
app.use(bodyParser.urlencoded({ limit: "300mb", extended: true }));
app.use("/uploads", express.static(__dirname + "/public/uploads"));

// global алдаа шалгах  function
app.use(errorHandler);

io.on("connection", (socket) => {
  console.log("A user connected");

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
