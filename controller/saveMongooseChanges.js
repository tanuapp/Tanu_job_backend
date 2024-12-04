const Model = require("../models/customer");
const asyncHandler = require("../middleware/asyncHandler");
const customResponse = require("../utils/customResponse");

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
    customResponse.error(res, error.message);
  }
});
