const Model = require("../models/series");
const Page = require("../models/journal");
const asyncHandler = require("../middleware/asyncHandler");
const customResponse = require("../utils/customResponse");

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

  const transliterated = text
    .toLowerCase()
    .split("")
    .map((char) => cyrillicToLatinMap[char] || char)
    .join("");

  const slug = transliterated.replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");

  return slug;
}

exports.viewsIncrement = asyncHandler(async (req, res, next) => {
  try {
    const data = await Model.findById(req.params.id);
    data.views++;
    await data.save();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.getTopSeries = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find()
      .populate("pages")
      .sort({ views: -1 })
      .limit(5);
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

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find().populate({
      path: "pages",
      populate: {
        path: "category"
      }
    });
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

// exports.createModel = asyncHandler(async (req, res, next) => {
//   try {
//     const sliderImg = req.files.sliderImg
//       ? req.files.sliderImg.map((file) => file.filename)
//       : [];
//     const bodyImages = req.files.bodyImg
//       ? req.files.bodyImg.map((file) => file.filename)
//       : [];
//     const profile = req.files.profile ? req.files.profile[0].filename : null;
//     const audio = req.files.audio ? req.files.audio[0].filename : null;

//     // Combine request body with file paths
//     const newEntryData = {
//       ...req.body,
//       sliderImg,
//       bodyImages,
//       profile,
//       audio,
//       slug: cyrillicToEnglishSlugify(req.body.name),
//     };

//     const newEntry = await Page.create(newEntryData);

//     res.status(200).json({
//       success: true,
//       data: newEntry,
//     });
//   } catch (error) {
//     res.status(200).json({
//       success: false,
//       msg: "Server Error: " + error.message,
//     });
//   }
// });

exports.addPage = asyncHandler(async (req, res, next) => {
  try {
    if (req.body._id) {
      const journal = await Model.findById(req.params.id);
      journal.pages?.push(req.body._id);
      await journal.save();
    } else {
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
      const p = await Page.create(newEntryData);
      const journal = await Model.findById(req.params.id);
      journal.pages.push(p._id);
      await journal.save();
    }

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.create = asyncHandler(async (req, res, next) => {
  try {
    const inputData = {
      ...req.body,
      photo: req.file ? req.file.filename : "no-photo.png",
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
      photo: req.file ? req.file.filename : old.photo,
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
    const allText = await Model.findById(req.params.id).populate({
      path: "pages",
      populate: {
        path: "category"
      }}
    );
    return res.status(200).json({
      success: true,
      data: allText,
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

// Энд дуусаж байгаа шүүү
