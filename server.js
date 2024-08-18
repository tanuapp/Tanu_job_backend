const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const logger = require("./middleware/logger.js");
dotenv.config({ path: "./config/config.env" });
const connectDB = require("./db");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const AWS = require("aws-sdk");

//router routes import
const userRoutes = require("./routes/user");
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
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

const app = express();
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
    accessKeyId: "AKIAXEVXYPLF5W5B6EHK",
    secretAccessKey: "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",
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

// app.use("/api/v1/withdraw", withdrawRoute);
// file upload limit gej oilgoson
app.use(bodyParser.json({ limit: "300mb" }));
app.use(bodyParser.urlencoded({ limit: "300mb", extended: true }));
app.use("/uploads", express.static(__dirname + "/public/uploads")); // Server uploaded files

// global алдаа шалгах  function
app.use(errorHandler);

// exporess server ajiluulah
const server = app.listen(
  process.env.PORT,
  console.log(`Express server is running on port ${process.env.PORT}`)
);

process.on("unhandledRejection", (err, promise) => {
  console.log(`Unhandled rejection error: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});
