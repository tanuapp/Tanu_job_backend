const Model = require("../models/service");
const asyncHandler = require("../middleware/asyncHandler");
const mongoose = require("mongoose");
const customResponse = require("../utils/customResponse");

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    const categories = await Model.find();
    const total = await Model.countDocuments();
    res.status(200).json({
      success: true,
      count: total,
      data: categories,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});
exports.getcompany = asyncHandler(async (req, res, next) => {
  try {
    const companyId = req.params.id;

    const services = await Model.find({ companyId }).populate({
      path: "artistId",
      select: "first_name last_name photo", // хүсвэл artist-ийн зөвхөн эдгээр талбарыг авна
    });

    const total = await Model.countDocuments({ companyId });

    res.status(200).json({
      success: true,
      count: total,
      data: services,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});
exports.getServicesByArtist = asyncHandler(async (req, res) => {
  try {
    console.log("🚀 [SERVICE] getServicesByArtist дуудлаа");

    const { artistId } = req.body;

    if (!artistId) {
      return res.status(400).json({
        success: false,
        msg: "artistId байхгүй байна",
      });
    }

    console.log("🎨 artistId:", artistId);

    // Зөвхөн artistId-аар шүүх
    const services = await Model.find({ artistId }).populate({
      path: "artistId",
      select: "first_name last_name photo",
    });

    const total = await Model.countDocuments({ artistId });

    res.status(200).json({
      success: true,
      count: total,
      data: services,
    });

    console.log("✅ Services found for artist:", services.length);
  } catch (error) {
    console.log("❌ Error:", error.message);
    customResponse.error(res, error.message);
  }
});

exports.getServicesByIds = asyncHandler(async (req, res) => {
  try {
    const { serviceIds } = req.body;

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      console.warn("⚠️ [getServicesByIds] serviceIds is missing or invalid");
      return res.status(400).json({
        success: false,
        msg: "serviceIds массив хоосон эсвэл буруу байна",
      });
    }

    const services = await Model.find({
      _id: { $in: serviceIds },
    }).populate({
      path: "artistId",
      select: "first_name last_name photo",
    });

    services.forEach((s) => {});

    return res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    console.error("❌ [getServicesByIds] Error:", error.message);
    customResponse.error(res, error.message);
  }
});

exports.create = asyncHandler(async (req, res, next) => {
  try {
    const inputData = {
      ...req.body,
      photo: req.file?.filename ? req.file.filename : "no user photo",
    };

    const user = await Model.create(inputData);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.update = asyncHandler(async (req, res, next) => {
  try {
    const old = await Model.findById(req.params.id);
    const updatedData = {
      ...req.body,
      photo: req.file ? req.file?.filename : old.photo,
    };

    const upDateUserData = await Model.findByIdAndUpdate(
      req.params.id,
      updatedData,
      {
        new: true,
      }
    );
    return res.status(200).json({
      success: true,
      data: upDateUserData,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.get = asyncHandler(async (req, res, next) => {
  try {
    const allText = await Model.findById(req.params.id);
    const all = await Model.findById(req.params.id).populate("artistId");
    allText.views++;
    await allText.save();
    return res.status(200).json({
      success: true,
      data: {
        ...allText.toObject(),
        artist: all.artistId,
      },
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.deleteModel = async function deleteUser(req, res, next) {
  try {
    const deletePost = await Model.findByIdAndDelete(req.params.id, {
      new: true,
    });
    return res.status(200).json({
      success: true,
      msg: "Ажилттай усгагдлаа",
      data: deletePost,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
};
exports.getDiscountedServices = asyncHandler(async (req, res, next) => {
  try {
    const services = await Model.find({ discount: { $gt: 0 } })
      .sort({ discount: -1 })
      .populate({
        path: "artistId",
        select: "first_name last_name photo",
      });

    // ⏰ үлдсэн өдрийг тооцоолох
    const now = new Date();
    const servicesWithRemaining = services.map((service) => {
      let remainingDays = null;

      if (service.discountEnd) {
        const diffMs = new Date(service.discountEnd).getTime() - now.getTime();
        if (diffMs > 0) {
          remainingDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)); // өдөр болгон хувиргана
        }
      }

      return {
        ...service.toObject(),
        remainingDays, // ⏰ зөвхөн өдөр
      };
    });

    console.log("servicesWithRemaining", servicesWithRemaining);

    return res.status(200).json({
      success: true,
      count: servicesWithRemaining.length,
      data: servicesWithRemaining,
    });
  } catch (error) {
    console.error("❌ [getDiscountedServices] Error:", error.message);
    customResponse.error(res, error.message);
  }
});
