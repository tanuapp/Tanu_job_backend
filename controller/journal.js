const Model = require("../models/journal");
const asyncHandler = require("../middleware/asyncHandler");

function cyrillicToEnglishSlugify(text) {
  const cyrillicToLatinMap = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "y",
    ё: "e",
    ж: "j",
    з: "z",
    и: "i",
    й: "i",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    ө: "u",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "kh",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ы: "ii",
    э: "e",
    ю: "yu",
    я: "y",
  };

  // Transliterate each Cyrillic character to its Latin equivalent
  const transliterated = text
    .toLowerCase()
    .split("")
    .map((char) => cyrillicToLatinMap[char] || char)
    .join("");

  // Replace spaces and special characters with hyphens
  const slug = transliterated.replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");

  // Return the final slug
  return slug;
}

exports.getAllModel = asyncHandler(async (req, res, next) => {
  try {
    const data = await Model.find();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Серверийн алдаа: " + error.message,
    });
  }
});

exports.viewsIncrement = asyncHandler(async (req, res, next) => {
  try {
    const data = await Model.findOne({
      slug: req.params.id,
    });
    data.views++;
    await data.save();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Серверийн алдаа: " + error.message,
    });
  }
});

exports.getModel = asyncHandler(async (req, res, next) => {
  try {
    const data = await Model.findOne({
      slug: req.params.id,
    });
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Серверийн алдаа: " + error.message,
    });
  }
});
exports.updateModel = asyncHandler(async (req, res, next) => {
  try {
    const data = await Model.findOne({
      slug: req.params.id,
    });
    const sliderImg = req.files.sliderImg
      ? req.files.sliderImg.map((file) => file.filename)
      : data.sliderImg;
    const bodyImages = req.files.bodyImg
      ? req.files.bodyImg.map((file) => file.filename)
      : data.bodyImages;
    const profile = req.files.profile
      ? req.files.profile[0].filename
      : data.profile;
    const audio = req.files.audio ? req.files.audio[0].filename : data.audio;

    const newEntryData = {
      ...req.body,
      sliderImg,
      bodyImages,
      profile,
      audio,
      slug: req.body.name ? cyrillicToEnglishSlugify(req.body.name) : data.slug,
    };

    const newEntry = await Model.findOneAndUpdate(
      {
        slug: req.params.id,
      },
      newEntryData
    );
    res.status(200).json({
      success: true,
      data: newEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Серверийн алдаа: " + error.message,
    });
  }
});

exports.createModel = asyncHandler(async (req, res, next) => {
  try {
    const sliderImg = req.files.sliderImg
      ? req.files.sliderImg.map((file) => file.filename)
      : [];
    const bodyImages = req.files.bodyImg
      ? req.files.bodyImg.map((file) => file.filename)
      : [];
    const profile = req.files.profile ? req.files.profile[0].filename : null;
    const audio = req.files.audio ? req.files.audio[0].filename : null;

    // Combine request body with file paths
    const newEntryData = {
      ...req.body,
      sliderImg,
      bodyImages,
      profile,
      audio,
      slug: cyrillicToEnglishSlugify(req.body.name),
    };

    const newEntry = await Model.create(newEntryData);

    res.status(200).json({
      success: true,
      data: newEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Server Error: " + error.message,
    });
  }
});
exports.deleteModel = asyncHandler(async (req, res, next) => {
  try {
    const newEntry = await Model.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      data: newEntry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Server Error: " + error.message,
    });
  }
});
