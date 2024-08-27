const Model = require("../models/area");
const asyncHandler = require("../middleware/asyncHandler");

exports.getAllModel = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find();
    const total = await Model.countDocuments();
    res.status(200).json({
      success: true,
      count: total,
      data: allUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.generateHoroo = asyncHandler(async (req, res, next) => {
  try {
    const { horoo, subdistrict } = req.body;
    for (let i = 1; i <= horoo; i++) {
      await Model.create({
        subdistrict,
        name: `${i} хороо`,
      });
    }
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.generateSum = asyncHandler(async (req, res, next) => {
  try {
    const sumuud = [
      "Батноров",
      "Батширээт",
      "Баян-Адарга",
      "Баянмөнх",
      "Баян-Овоо",
      "Баянхутаг",
      "Биндэр",
      "Бор-Өндөр",
      "Галшар",
      "Дадал",
      "Дархан",
      "Дэлгэрхаан",
      "Жаргалтхаан",
      "Мөрөн",
      "Норовлин",
      "Өмнөдэлгэр",
      "Хэрлэн",
      "Цэнхэрмандал",
    ];
    const { subdistrict } = req.body;
    sumuud.map(async (list, index) => {
      await Model.create({
        name: list,
        subdistrict,
      });
    });
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.createModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.create({
      ...req.body,
    });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.updateModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.findByIdAndUpdate(req.params.id, {
      ...req.body,
    });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
exports.getModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.findById(req.params.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.deleteModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
