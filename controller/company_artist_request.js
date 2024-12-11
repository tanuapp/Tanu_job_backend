const Model = require("../models/company");
const Artist = require("../models/artist");
const asyncHandler = require("../middleware/asyncHandler");
const mongoose = require("mongoose");
const customResponse = require("../utils/customResponse");

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    const categories = await Artist.find({
      status: false,
      companyId: req.body.company,
    });

    customResponse.success(res, categories);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.accept = asyncHandler(async (req, res, next) => {
  try {
    const categories = await Artist.findByIdAndUpdate(req.params.id, {
      status: true,
    });

    customResponse.success(res, categories);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.deny = asyncHandler(async (req, res, next) => {
  try {
    const categories = await Artist.findByIdAndDelete(req.params.id, {
      status: false,
    });

    customResponse.success(res, categories);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.create = asyncHandler(async (req, res, next) => {
  try {
    const parentId = req.body.parent;

    const user = await Model.create({
      ...req.body,
    });
    customResponse.success(res, user);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.update = asyncHandler(async (req, res, next) => {
  try {
    const updatedData = {
      ...req.body,
    };

    const upDateUserData = await Model.findByIdAndUpdate(
      req.params.id,
      updatedData,
      {
        new: true,
      }
    );
    customResponse.success(res, upDateUserData);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.get = asyncHandler(async (req, res, next) => {
  try {
    const allText = await Model.findById(req.params.id);
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
