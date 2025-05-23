const { removeBackground } = require("../utils/bgRemove");
const asyncHandler = require("../middleware/asyncHandler");
const path = require("path");
const fs = require("fs");

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const filename = req.file.filename;
    await removeBackground(filename); // Process file

    // Send the processed image back
    const outputPath = path.join(__dirname, `../public/uploads/${filename}`);
    const imageBuffer = fs.readFileSync(outputPath);

    res.setHeader("Content-Type", "image/png");
    res.send(imageBuffer); // ⬅️ send binary image
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
