const Model = require("../models/agent");
const Company = require("../models/company");
const asyncHandler = require("../middleware/asyncHandler");
const customResponse = require("../utils/customResponse");

exports.getAll = asyncHandler(async (req, res, next) => {
  try {
    // Agent-уудыг авах
    const agents = await Model.find().lean();

    // Agent бүрийн компанийн тоог бодитоор тооцоолж шинэчилнэ
    const updatedAgents = await Promise.all(
      agents.map(async (agent) => {
        const total = await Company.countDocuments({ agent: agent.agent });

        // Agent model дээр totalcompany-г шинэчилж хадгалах
        await Model.findByIdAndUpdate(agent._id, {
          totalcompany: String(total),
        });

        // Харуулах мэдээлэлд totalcompany-г шинэчилж өгнө
        return {
          ...agent,
          totalcompany: String(total),
        };
      })
    );

    const total = await Model.countDocuments();

    res.status(200).json({
      success: true,
      count: total,
      data: updatedAgents,
    });
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.create = asyncHandler(async (req, res, next) => {
  try {
    // Сүүлд үүссэн агентыг олж авна
    const lastAgent = await Model.findOne().sort({ createdAt: -1 }).limit(1);

    let lastNumber = 0;

    if (lastAgent && lastAgent.agent) {
      // "AG000123" → 123 болгон хөрвүүлж, дараагийн дугаар гаргана
      lastNumber = parseInt(lastAgent.agent.slice(2), 10);
    }

    const formattedCode = `AG${String(lastNumber + 1).padStart(6, "0")}`; // AG000001, AG000002 ...

    // Агентын мэдээлэл
    const inputData = {
      ...req.body,
      agent: formattedCode,
    };

    const newAgent = await Model.create(inputData);

    return res.status(200).json({
      success: true,
      data: newAgent,
    });
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
