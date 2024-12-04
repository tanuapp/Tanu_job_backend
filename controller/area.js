const Model = require("../models/area");
const asyncHandler = require("../middleware/asyncHandler");
const customResponse = require("../utils/customResponse");

exports.getAllModel = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find();

    customResponse.success(res, allUser);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.clearModel = asyncHandler(async (req, res, next) => {
  try {
    const toDel = [
      "66cd23af4aec91dde0b4fc08",
      "66cd23bc4aec91dde0b4fc0a",
      "66cd23c74aec91dde0b4fc0c",
      "66cd23d14aec91dde0b4fc0e",
      "66cd23d64aec91dde0b4fc10",
      "66cd23df4aec91dde0b4fc12",
      "66cd23e54aec91dde0b4fc14",
      "66cd23fc4aec91dde0b4fc16",
      "66cd24064aec91dde0b4fc18",
    ];
    const allUser = await Model.find();

    allUser.map(async (list) => {
      if (!toDel.includes(list.subdistrict)) {
        await Model.findByIdAndDelete(list._id);
      }
    });

    customResponse.success(res, allUser);
  } catch (error) {
    customResponse.error(res, error.message);
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

    customResponse.success(res, "");
  } catch (error) {
    customResponse.error(res, error.message);
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

    customResponse.success(res, "");
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.createModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.create({
      ...req.body,
    });

    customResponse.success(res, result);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.updateModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.findByIdAndUpdate(req.params.id, {
      ...req.body,
    });

    customResponse.success(res, result);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});
exports.getModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.findById(req.params.id);

    customResponse.success(res, result);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.deleteModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.findByIdAndDelete(req.params.id);

    customResponse.success(res, result);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});
