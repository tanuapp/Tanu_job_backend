const Model = require("../models/customer");
const asyncHandler = require("../middleware/asyncHandler");

//model deer uurchlult oruulsan tohioldold ene functiong ajiluulna
//!! model oo solihoo martvaa

exports.saveMongooseChanges = asyncHandler(async (req, res, next) => {
  try {
    const models = await Model.find();
    for (const model of models) {
      await model.save();
    }

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(200).json({ success: false, error: error.message });
  }
});
