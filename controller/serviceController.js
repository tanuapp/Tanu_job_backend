const asyncHandler = require("../middleware/asyncHandler");
const paginate = require("../utils/pagination");
const { companyIdFind } = require("../middleware/addTime");
const Service = require("../models/serviceModel");
const Item = require("../models/itemModel");
const artistModel = require("../models/artistModel");
const companyModel = require("../models/companyModel");
function calculateNumberOfServices(openTime, closeTime, currentTime) {
  openTime = new Date(openTime);
  closeTime = new Date(closeTime);
  let totalOperationalTime = (closeTime - openTime) / (1000 * 60);
  let numberOfServices = Math.ceil(totalOperationalTime / currentTime);
  const array = [];
  for (let i = 0; i < numberOfServices; i++) {
    const serviceTime = new Date(
      openTime.getTime() + i * currentTime * 60 * 1000
    );
    array.push(serviceTime.toLocaleTimeString());
    console.log(`Service ${i + 1}: ${serviceTime.toLocaleTimeString()}`);
  }
  return array;
}
exports.create = asyncHandler(async (req, res) => {
  try {
    const company = await companyIdFind(req.userId);
    console.log(company);
    console.log("req body ------------ ", company[0].open, company[0].close);
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    const date = `${year}-${month < 10 ? "0" : ""}${month}-${
      day < 10 ? "0" : ""
    }${day}T`;

    const openTime = date + company[0].open;
    const closeTime = date + company[0].close;
    const currentTime = 60;

    console.log("Number of times timekeeping services can be provided:");
    const itemArray = calculateNumberOfServices(
      openTime,
      closeTime,
      currentTime
    );
    console.log("item array ---------------- ", itemArray);
    const user = req.userId;
    const uploadedFiles = [];

    // Process uploaded files
    if (req.files && Array.isArray(req.files.files)) {
      for (let i = 0; i < req.files.files.length; i++) {
        uploadedFiles.push({ name: req.files.files[i].filename });
      }
    } else {
      console.warn("req.files.files is not an array");
    }

    // Create service
    let input = {
      ...req.body,
      createUser: user,
      files: uploadedFiles,
      companyId: company[0]._id,
    };
    let newItem = await Service.create(input);
    console.log("new item ", newItem);
    // Create items associated with the service
    const realArray = await Promise.all(
      itemArray.map(async (timeString) => {
        const item = await Item.create({
          huwaari: timeString,
          Service: newItem._id,
        });
        return item;
      })
    );
    newItem = {
      ...newItem.toObject(),
      item: realArray,
    };

    return res.status(201).json({ data: newItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

exports.getCompanyService = asyncHandler(async (req, res) => {
  try {
    const services = await Service.find({
      companyId: req.params.companyid,
    });

    const company = await companyModel.findById(req.params.companyid);

    const serviceIds = services.map((service) => service._id).filter(Boolean);

    const serviceEs = await artistModel.find({
      _id: { $in: serviceIds },
    });

    console.log("---------------------", serviceEs);
    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No services found for this company",
      });
    }

    const servicesWithItems = await Promise.all(
      services.map(async (service) => {
        const items = await Item.find({ Service: service._id });
        return {
          ...service.toObject(),
          items,
          company,
        };
      })
    );

    return res.status(200).json({ success: true, data: servicesWithItems });
  } catch (error) {
    console.error("Error fetching company services:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

exports.postCompanyService = asyncHandler(async (req, res) => {
  try {
    const company = await companyIdFind(req.userId);
    if (!company || company.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    const services = await Service.find({ companyId: company[0]._id }).populate(
      "SubCategory"
    );

    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No services found for this company",
      });
    }

    const servicesWithItems = await Promise.all(
      services.map(async (service) => {
        const items = await Item.find({ Service: service._id });
        return {
          ...service.toObject(),
          items,
        };
      })
    );
    return res.status(200).json({ success: true, data: servicesWithItems });
  } catch (error) {
    console.error("Error fetching company services:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

exports.update = asyncHandler(async (req, res) => {
  try {
    const uploadedFiles = req.files && req.files.files ? [] : null;
    if (uploadedFiles) {
      if (Array.isArray(req.files.files)) {
        for (let i = 0; i < req.files.files.length; i++) {
          uploadedFiles.push({ name: req.files.files[i].filename });
        }
      } else {
        console.warn("req.files.files is not an array");
      }
    }

    const input = {
      ...req.body,
      files: uploadedFiles || [],
    };

    const newItem = await Service.findByIdAndUpdate(req.params.id, input, {
      new: true,
    });

    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

exports.getCategorySortItem = asyncHandler(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort;
    const minPrice = req.query.minPrice || 0;
    const maxPrice = req.query.maxPrice;
    const select = req.query.select;
    let search = req.query.search;
    [
      "select",
      "sort",
      "page",
      "limit",
      "search",
      "maxPrice",
      "minPrice",
    ].forEach((el) => delete req.query[el]);

    const pagination = await paginate(page, limit, model);
    if (!search) search = "";

    const query = {
      ...req.query,
      Category: req.params.category_id, // Updated this line
      title: { $regex: search, $options: "i" },
      price: { $gte: minPrice },
    };
    if (!isNaN(maxPrice)) {
      query.price.$lte = maxPrice;
    }
    const text = await Service.find(query, select)
      .populate({
        path: "Category",
        select: "catergoryName , photo",
      })
      .populate({
        path: "createUser",
        select: "name , phone , email , photo ",
      })
      .sort(sort)
      .skip(pagination.start - 1)
      .limit(limit);
    return res.status(200).json({
      success: true,
      pagination,
      count: text.length,
      data: text,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, count: text.length, error: error.message });
  }
});

exports.getSubcategorySortItem = asyncHandler(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort;
    const minPrice = req.query.minPrice || 0;
    const maxPrice = req.query.maxPrice;
    const select = req.query.select;
    let search = req.query.search;

    [
      "select",
      "sort",
      "page",
      "limit",
      "search",
      "maxPrice",
      "minPrice",
    ].forEach((el) => delete req.query[el]);

    const pagination = await paginate(page, limit, model);
    if (!search) search = "";

    // Create the query object
    const query = {
      ...req.query,
      SubCategory: req.params.subcategory_id, // Updated this line
      title: { $regex: search, $options: "i" },
      price: { $gte: minPrice },
    };

    // Include price condition if minPrice and maxPrice are provided and valid numbers
    if (!isNaN(maxPrice)) {
      query.price.$lte = maxPrice;
    }

    const text = await Service.find(query, select)
      .populate({
        path: "createUser",
        select: "name , phone , email , photo ",
      })
      .sort(sort)
      .skip(pagination.start - 1)
      .limit(limit);

    res.status(200).json({
      success: true,
      pagination,
      count: text.length,
      data: text,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.getSubCategoryByService = asyncHandler(async (req, res, next) => {
  try {
    const data = await Service.find({ SubCategory: req.params.subcategory_id });
    return res.status(200).json({ success: true, data: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.myUserServiceAll = asyncHandler(async (req, res) => {
  try {
    console.log("req user --------", req.userId);
    const text = await Service.find({ createUser: req.userId });
    return res.status(200).json({ data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.findDelete = asyncHandler(async (req, res, next) => {
  try {
    const text = await Service.findByIdAndDelete(req.params.id, {
      new: true,
    });
    return res.status(200).json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.detail = asyncHandler(async (req, res, next) => {
  try {
    let text = await Service.findById(req.params.id);
    let item = await Item.find({ Service: text._id });
    console.log("----------- item ", item);
    text = {
      ...text.toObject(),
      item,
    };
    return res.status(200).json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// exports.getAll = asyncHandler(async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 20;
//   const sort = req.query.sort;
//   const select = req.query.select;
//   let search = req.query.search;
//   ["select", "sort", "page", "limit", "search", "maxPrice", "minPrice"].forEach(
//     (el) => delete req.query[el]
//   );
//   const pagination = await paginate(page, limit, model);
//   if (!search) search = "";
//   const query = {
//     ...req.query,
//     title: { $regex: search, $options: "i" },
//   };
//   if (!isNaN(maxPrice)) {
//     query.price.$lte = maxPrice;
//   }
//   const text = await Service.find(query, select);
//   // .populate({
//   //   path: "Category",
//   //   select: "catergoryName , photo",
//   // })
//   // .populate({
//   //   path: "createUser",
//   //   select: "name , phone , email , photo ",
//   // })
//   // .sort(sort)
//   // .skip(pagination.start - 1)
//   // .limit(limit);

//   res.status(200).json({
//     success: true,
//     pagination,
//     data: text,
//   });
// });

exports.getAll = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort;
    const select = req.query.select;
    const search = req.query.search || "";
    const query = {
      name: { $regex: search, $options: "i" },
    };
    const pagination = await paginate(page, limit, Service, query);
    const data = await Service.find(query, select)
      .sort(sort)
      .skip(pagination.start - 1)
      .limit(limit)
      .populate("createUser");
    return res
      .status(200)
      .json({ success: true, pagination: pagination, data: data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});
