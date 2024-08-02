const model = require("../models/calendarModel");
const ItemModel = require("../models/itemModel");
const asyncHandler = require("../middleware/asyncHandler");
const { companyIdFind } = require("../middleware/addTime");
const serviceModel = require("../models/serviceModel");

const now = new Date();

const getMonth = (dt, add = 0) => {
  let month = dt.getMonth() + 1 + add;
  return month < 10 ? "0" + month : month.toString();
};

exports.create = asyncHandler(async (req, res, next) => {
  try {
    const { start, end, Service } = req.body;
    // console.log(start, end);
    // const user = req.userId;
    // -01T
    // -17T14:30:00'
    // 2024-05-03T14:30:00
    // 2024-05-05-T12:30:00
    // const newStart =
    //   now.getFullYear() + "-" + getMonth(now) + `-0${now.getDay(now)}T${start}`;
    // const newEnd =
    //   now.getFullYear() + "-" + getMonth(now) + `-0${now.getDay(now)}T${end}`;

    const service = await serviceModel
      .findById(Service)
      .populate("SubCategory");

    const { companyId } = service;

    const newStart = `2024-05-27T${start}`;
    const newEnd = "2024-05-27T12:30:00";

    console.log("log-------", newStart, newEnd);
    const data = {
      ...req.body,
      start: newStart,
      end: newEnd,
      Company: companyId,
    };
    const text = await model.create(data);
    return res.status(200).json({ success: true, text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
exports.artistServiceSort = asyncHandler(async (req, res) => {
  try {
    const { Service, Artist } = req.body;
    const query = {};
    if (Service) {
      query.Service = Service;
    }
    if (Artist) {
      query.Artist = Artist;
    }

    const data = await model
      .find(query)
      .populate("Artist")
      .populate("Service")
      .populate("Customer");

    let p = data.map((item) => ({
      ...item.toObject(),
      serviceName: item.Service ? item.Service.name : "fsdfsd",
      customerPhone: item.Customer ? item.Customer.phone : "ffgh",
    }));

    if (p.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "No data found matching the provided criteria.",
      });
    }

    res.status(200).json({
      success: true,
      data: p,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "An error occurred while retrieving data.",
      details: error.message,
    });
  }
});

exports.calendarSortByCompany = asyncHandler(async (req, res) => {
  try {
    // Find company by user ID
    const companyFind = await companyIdFind(req.userId);

    console.log("company created by user:",companyFind)

    // Ensure company was found
    if (companyFind.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "No company found for the provided user ID.",
      });
    }
    console.log("company find:",companyFind);
    const query = {
      Company: companyFind[0]._id,
    };

    // Find matching records in the model
    const data = await model
      .find(query)
      .populate("Artist")
      .populate("Service")
      .populate("Customer")
      .populate("Company");

    // Ensure data was found
    if (data.length === 0) {
      return res.status(204).json({
        success: false,
        msg: "No data found matching the provided Company.",
      });
    }

    // Return the found data
    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    // Handling unexpected server errors
    res.status(500).json({
      success: false,
      error: "An error occurred while retrieving data.",
      details: error.message,
    });
  }
});

exports.update = asyncHandler(async (req, res, next) => {
  try {
    const updatedData = {
      ...req.body,
    };
    const text = await model.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
    });
    return res.status(200).json({ success: true, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
    const text = await model.find();
    return res.status(200).json({ success: true, total: total, data: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
