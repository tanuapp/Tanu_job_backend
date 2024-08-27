const Model = require("../models/nam");
const asyncHandler = require("../middleware/asyncHandler");

exports.getAllModel = asyncHandler(async (req, res, next) => {
  try {
    const allUser = await Model.find();
    const total = await Model.countDocuments();
    res.status(200).json({
      success: true,
      count: total,
      data: allUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.generateNam = asyncHandler(async (req, res, next) => {
  try {
    const namuud = [
      "Монгол Ардын нам /МАН/",
      "Ардчилсан нам /АН/",
      "Монголын Ногоон нам /МНН/",
      "Иргэний зориг ногоон нам /ИЗНН/",
      "Монголын Уламжлалын Нэгдсэн нам /МУНН/",
      "Монголын Либерал Ардчилсан нам /МоЛАН/",
      "Эх Орон нам",
      "Монголын Либерал нам /МЛН/",
      "Бүгд найрамдах нам /БНН/",
      "Монголын эмэгтэйчүүдийн үндэсний нэгдсэн нам /МЭҮНН/",
      "Монголын Социал Демократ Нам",
      "Ардтүмний нам /АТН/",
      "Монгол үндэсний ардчилсан нам /МҮАН/",
      "Эрхчөлөөг хэрэгжүүлэгч нам",
      "Иргэний хөдөлгөөний нам /ИХН/",
      "Хөгжлийн хөтөлбөр нам",
      "Монголын Ардчилсан Хөдөлгөөний Нам",
      "Хамуг Монголын Хөдөлмөрийн нам /ХМХН/",
      "ХҮН нам /ХҮН/",
      "Эх орончдын нэгдсэн нам /ЭОНН/",
      "Монголконсерватив нам /МКН/",
      "Тусгаар тогтнол, эв нэгдлийн нам /ТТЭНН/",
      "Ард түмний хүч нам",
      "Монголын хүний төлөө нам",
      "Үнэн ба Зөв нам",
      "Эрх Чөлөөний Эвсэл нам /ЭЧЭН/",
      "Дэлхийн монголчууд нам (ДМН)",
      "Ард түмний олонхийн засаглал нам /АТОЗН/",
      "Их эв нам /ИЭН/",
      "Гэр хороолол хөгжлийн нам /ГХХН/",
      "Миний Монгол нам /ММН/",
      "Монгол шинэчлэлт нам /МШН/",
      "ШИНЭ нам /ШН/",
      "Зүй ёс нам /ЗЁН/",
      "Ардчилал шинэчлэлийн нам",
      "Иргэдийн Оролцооны Нэгдэл Нам /ИОНН/",
      "Сайн ардчилсан иргэдийн нэгдсэн нам /САИНН/",
    ];
    namuud.map(
      async (list) =>
        await Model.create({
          name: list,
        })
    );
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.createModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Model.create({
      ...req.body,
    });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
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
    res.status(500).json({ success: false, error: error.message });
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
    res.status(500).json({ success: false, error: error.message });
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
    res.status(500).json({ success: false, error: error.message });
  }
});
