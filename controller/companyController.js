const model = require("../models/companyModel");
const asyncHandler = require("../middleware/asyncHandler");
const locationModel = require("../models/locationModel");

exports.create = asyncHandler(async (req, res, next) => {
  try {
    const user = req.userId;

    // const uploadedFiles = [];
    // console.log(req.body);
    // if (req.files && Array.isArray(req.files.files)) {
    //   for (let i = 0; i < req.files.files.length; i++) {
    //     uploadedFiles.push({ name: req.files.files[i].filename });
    //   }
    // } else {
    //   console.warn("req.files.files is not an array");
    // }
    const data = {
      ...req.body,
      companyCreater: user,
      // logo: req.file?.filename,
      // files: uploadedFiles,
    };

    const text = await model.create(data);
    return res.status(200).json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.getSubCategoryByCompany = asyncHandler(async (req, res) => {
  try {
    const id = req.params.subcategory_id;
    const text = await model.find({ SubCategory: id }).populate("SubCategory");
    return res.status(200).json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.update = asyncHandler(async (req, res, next) => {
  console.log("update company body:", req.body);
  console.log("update company logo:", req.file);
  try {
    // const fileName1 = req.files["logo"]
    //   ? req.files["logo"][0].filename
    //   : "no logo ?";
    // const uploadedFiles = [];

    // if (req.files && Array.isArray(req.files.files)) {
    //   for (let i = 0; i < req.files.files.length; i++) {
    //     uploadedFiles.push({ name: req.files.files[i].filename });
    //   }
    // } else {
    //   console.warn("req.files.files is not an array");
    // // }
    const updatedData = {
      ...req.body,
      logo: req.file ? req.file.filename : "no photo.png",
    };
    const text = await model.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    });
    return res.status(200).json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
});

exports.findDelete = asyncHandler(async (req, res, next) => {
  try {
    const text = await model.findByIdAndDelete(req.params.id, {
      new: true,
    });
    return res.status(200).json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.getUserCompany = asyncHandler(async (req, res) => {
  try {
    const text = await model
      .find({ companyCreater: req.userId })
      .populate("Category")
      .populate("SubCategory");
    return res.status(200).json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.detail = asyncHandler(async (req, res, next) => {
  try {
    const text = await model.findById(req.params.id);
    return res.status(200).json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    const total = await model.countDocuments();

    const mainData = await model.find().populate("Category");

    const companyId = mainData.map((service) => service._id).filter(Boolean);

    const location = await locationModel.find({
      Company: { $in: companyId },
    });

    const servicesWithItems = await Promise.all(
      mainData.map(async (service) => {
        const serviceLocations = location.filter((loc) =>
          loc.Company.equals(service._id)
        );
        return {
          ...service.toObject(),
          location: serviceLocations[0],
        };
      })
    );

    return res.status(200).json({
      success: true,
      total: total,
      data: servicesWithItems,
    });
  } catch (error) {
    console.error("Error fetching data in getAll:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// exports.getAll = asyncHandler(async (req, res, next) => {
//   try {
//     const total = await model.countDocuments();

//     const mainData = await model
//       .find()
//       .populate("Category")
//       .populate("SubCategory");

//     const mainDataIds = mainData.map((data) => data._id);

//     const artists = await artistModel.find({ Company: { $in: mainDataIds } });
//     const services = await serviceModel.find({
//       companyId: { $in: mainDataIds },
//     });

//     return res.status(200).json({
//       success: true,
//       total: total,
//       data: {
//         main: mainData,
//         artists,
//         services,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching data in getAll:", error);
//     return res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// });
exports.sortBySubCategory = asyncHandler(async (req, res) => {
  try {
    const subCatId = req.params.sub_id;
    const companies = await model.find({ SubCategory: { $in: [subCatId] } });

    if (!companies || companies.length === 0) {
      return res.status(404).json({
        error: "Companies not found for the specified subcategory ID",
      });
    }

    return res.status(200).json({ companies });
  } catch (error) {
    console.error("Error sorting companies by subcategory:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
