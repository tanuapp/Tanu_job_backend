const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const logger = require("./middleware/logger.js");
dotenv.config({ path: "./config/config.env" });
const connectDB = require("./db");
const bodyParser = require("body-parser");

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
const errorHandler = require("./middleware/error.js");
connectDB();
const app = express();
app.use(cors());
app.use(logger);
app.use(express.json());

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
