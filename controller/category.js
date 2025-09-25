const Model = require("../models/category");
const asyncHandler = require("../middleware/asyncHandler");
const mongoose = require("mongoose");
const customResponse = require("../utils/customResponse");

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    const categories = await Model.find({ parent: null }).populate("children");

    customResponse.success(res, categories);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.getByPlatform = asyncHandler(async (req, res, next) => {
  try {
    const { platform } = req.params;
    console.log("✌️platform --->", platform);
    const normalizedPlatform = platform.trim().toLowerCase();

    if (!["business", "job"].includes(normalizedPlatform)) {
      return customResponse.error(res, "Invalid platform type");
    }

    const categories = await Model.find({
      parent: null,
      platforms: { $in: [normalizedPlatform] },
    }).populate("children");

    customResponse.success(res, categories);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.create = asyncHandler(async (req, res, next) => {
  try {
    const parentId = req.body.parent;

    // platforms талбарыг string ирсэн бол JSON.parse хийж хувиргана
    let platforms = [];
    if (req.body.platforms) {
      try {
        platforms = JSON.parse(req.body.platforms);
      } catch (e) {
        platforms = Array.isArray(req.body.platforms)
          ? req.body.platforms
          : [req.body.platforms];
      }
    }

    const category = await Model.create({
      name: req.body.name,
      platforms, // 🟢 массив болгоод хадгална
      photo: req.file ? req.file.filename : "no-img.png",
      parent: parentId ? parentId : null,
    });

    customResponse.success(res, category);
    console.log("✅ category created:", category);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.update = asyncHandler(async (req, res, next) => {
  try {
    let platforms = [];

    if (req.body.platforms) {
      try {
        // Хэрэв JSON string ирвэл parse хийнэ
        platforms = JSON.parse(req.body.platforms);
      } catch (e) {
        // Хэрэв array эсвэл string ирвэл шууд массив болгоно
        platforms = Array.isArray(req.body.platforms)
          ? req.body.platforms
          : [req.body.platforms];
      }
    }

    const updatedData = {
      name: req.body.name,
      platforms, // 🟢 зөв массив хадгална
      photo: req.file?.filename,
    };

    const upDateUserData = await Model.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    customResponse.success(res, upDateUserData);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.get = asyncHandler(async (req, res, next) => {
  try {
    const allText = await Model.findById(req.params.id).populate("children");
    customResponse.success(res, allText);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.deleteModel = async function deleteUser(req, res, next) {
  try {
    const deletePost = await Model.findByIdAndDelete(req.params.id, {
      new: true,
    });
    customResponse.success(res, deletePost);
  } catch (error) {
    customResponse.error(res, error.message);
  }
};
