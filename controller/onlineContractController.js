const onlineContractModel = require("../models/onlineContract");
const asyncHandler = require("../middleware/asyncHandler");

exports.createModel = asyncHandler(async (req, res, next) => {
  try {
    console.log("File uploaded:", req.file);
    const data = {
      ...req.body,
      pdfFile: req.file ? req.file.filename : null, // If a file is uploaded, store its filename
    };

    const contract = await onlineContractModel.create(data);
    return res.status(200).json({ success: true, data: contract });
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.update = asyncHandler(async (req, res, next) => {
  try {
    const data = {
      ...req.body,
    };

    // If a new PDF file is uploaded, update the pdfFile field
    if (req.file) {
      data.pdfFile = req.file.filename;
    }

    // Update the record and return the updated data
    const contract = await onlineContractModel.findByIdAndUpdate(req.params.id, data, {
      new: true,
    });

    return res.status(200).json({ success: true, data: contract });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.findDelete = asyncHandler(async (req, res, next) => {
  try {
    // Delete the online contract by ID
    const contract = await onlineContractModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({ success: true, data: contract });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.detail = asyncHandler(async (req, res, next) => {
  try {
    // Fetch contract details by ID
    const contract = await onlineContractModel.findById(req.params.id);

    return res.status(200).json({ success: true, data: contract });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    console.log("ghf")
    // Fetch all online contracts and the total count
    const total = await onlineContractModel.countDocuments();
    const contracts = await onlineContractModel.find();

    return res.status(200).json({ success: true, total: total, data: contracts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
