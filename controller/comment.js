const Model = require("../models/comment");
const asyncHandler = require("../middleware/asyncHandler");
const ArtistRating = require("../models/artistRating");
const Artist = require("../models/artist");
const customResponse = require("../utils/customResponse");
const Company = require("../models/company");

exports.getAllModel = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find().populate("user");
    const total = await Model.countDocuments();
    res.status(200).json({
      success: true,
      count: total,
      data: allUser,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.createModel = asyncHandler(async (req, res, next) => {
  const { comment, companyId, user, artistId, rating } = req.body;

  // 1. Comment хадгалах
  const savedComment = await Model.create({ comment, companyId, user, rating });

  // 2. ArtistId болон Rating байвал рейтинг хадгална
  if (artistId && typeof rating !== "undefined") {
    const numericRating = Number(rating);

    if (numericRating >= 1 && numericRating <= 5) {
      // 2.1 Уг artist-д өгсөн бүх үнэлгээг авч дундаж гаргах
      const artistAllRatings = await ArtistRating.find({ artistId });
      const artistAvg =
        artistAllRatings.length > 0
          ? artistAllRatings.reduce((sum, r) => sum + r.rating, 0) /
            artistAllRatings.length
          : numericRating;

      // 2.2 Artist model дээр avgRating хадгалах
      const updatedArtist = await Artist.findByIdAndUpdate(
        artistId,
        { avgRating: artistAvg },
        { new: true }
      );

      // 2.3 ArtistRating үүсгэх
      const companyIdFromArtist = updatedArtist.companyId;

      try {
        const createdRating = await ArtistRating.create({
          artistId,
          companyId: companyIdFromArtist?.toString(),
          user,
          rating: numericRating,
        });
      } catch (err) {
        console.error("❌ ArtistRating.create error:", err);
      }

      // 2.4 Company-ийн бүх artist-уудын дундажийг гаргаж, company.rating шинэчлэх
      if (companyIdFromArtist) {
        const allArtists = await Artist.find({
          companyId: companyIdFromArtist,
        });
        const ratings = allArtists
          .map((a) => a.avgRating || 0)
          .filter((r) => r > 0);

        if (ratings.length > 0) {
          const companyAvg =
            ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

          await Company.findByIdAndUpdate(companyIdFromArtist, {
            rating: companyAvg,
          });

          console.log("🏢 Company average rating updated:", companyAvg);
        } else {
          console.log("⚠️ No valid ratings found for company.");
        }
      } else {
        console.log("❌ companyIdFromArtist is null or undefined.");
      }
    } else {
      console.log("⚠️ Rating is outside of valid range.");
    }
  } else {
    console.log("ℹ️ No artistId or rating provided.");
  }

  res.status(200).json({ success: true, data: savedComment });
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
    customResponse.error(res, error.message);
  }
});
const mongoose = require("mongoose");

exports.getCommentsByCompanyId = asyncHandler(async (req, res) => {
  try {
    const companyId = req.params.id; // 🟢 Үүнийг ингэж ЗАС

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid companyId" });
    }

    const objectId = new mongoose.Types.ObjectId(companyId);

    const comments = await Model.find({ companyId: objectId })
      .populate("user")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (error) {
    console.error("❌ getCommentsByCompanyId error:", error);
    customResponse.error(res, error.message);
  }
});
exports.getCommentsByFreelancerId = asyncHandler(async (req, res) => {
  try {
    const freelancerId = req.params.id; // 🟢 Үүнийг ингэж ЗАС

    if (!mongoose.Types.ObjectId.isValid(freelancerId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid freelancerId" });
    }

    const objectId = new mongoose.Types.ObjectId(freelancerId);

    const comments = await Model.find({ freelancerId: objectId })
      .populate("user")
      .sort({ createdAt: -1 });

    console.log("✅ comments:", comments);
    console.log("📦 Total comments:", comments.length);

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (error) {
    console.error("❌ getCommentsByCompanyId error:", error);
    customResponse.error(res, error.message);
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
    customResponse.error(res, error.message);
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
    customResponse.error(res, error.message);
    s;
  }
});
