const { removeBackground } = require("../utils/bgRemove");

const asyncHandler = require("../middleware/asyncHandler");

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    if (req.file) {
      await removeBackground(req.file.filename);
    }

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    //     customResponse.error(res, error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});
