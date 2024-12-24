const express = require("express");
const upload = require("../middleware/uploadMiddleware"); // Multer upload middleware
const {
  createModel,
  detail,
  findDelete,
  getAll,
  update,
} = require("../controller/onlineContractController"); // Controller functions

const router = express.Router();

// Use 'upload.single("pdfFile")' to accept a single PDF file upload with the field name 'pdfFile'
const cpUploads = upload.single("pdfFile");

// Define routes for onlineContracts

// Route for creating a new contract and fetching all contracts
router.route("/")
  .post(cpUploads, createModel)  // POST route for creating a new contract with file upload
  .get(getAll);             // GET route for fetching all contracts

// Route for fetching a specific contract, updating it, and deleting it
router.route("/:id")
  .get(detail)             // GET route for fetching a specific contract
  .delete(findDelete)      // DELETE route for deleting a specific contract
  .put(cpUploads, update); // PUT route for updating an existing contract with optional file upload

module.exports = router;
