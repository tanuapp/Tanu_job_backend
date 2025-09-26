const asyncHandler = require("../middleware/asyncHandler");
const Order = require("../models/order");
const Service = require("../models/service");
const Freelancer = require("../models/freelancer");

exports.createOrder = asyncHandler(async (req, res) => {
  let { serviceId, freelancerId, address, lat, lng, price } = req.body;

  // serviceId-г заавал array болгоно
  if (!Array.isArray(serviceId)) {
    serviceId = [serviceId];
  }

  // бүх үйлчилгээ байгаа эсэхийг шалгах
  const services = await Service.find({ _id: { $in: serviceId } });
  if (!services || services.length === 0) {
    return res
      .status(404)
      .json({ success: false, message: "Үйлчилгээ олдсонгүй" });
  }

  // order үүсгэх
  const order = await Order.create({
    user: req.userId,
    freelancer: freelancerId, // 👈 энэ талбарыг хадгалах хэрэгтэй
    service: serviceId, // олон үйлчилгээ хадгална
    address,
    lat,
    lng,
    price,
    status: "new",
  });

  res.status(201).json({ success: true, data: order });
});

exports.assignProvider = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId);
  if (!order)
    return res
      .status(404)
      .json({ success: false, message: "Захиалга олдсонгүй" });
  const provider = await Freelancer.findOne({ online: true }).sort({
    rating_avg: -1,
  });
  if (!provider)
    return res
      .status(400)
      .json({ success: false, message: "Онлайн үйлчилгээ үзүүлэгч байхгүй" });
  order.freelancer = provider._id;
  order.status = "assigned";
  await order.save();
  res.status(200).json({ success: true, data: order });
});
exports.acceptOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId);
  if (!order)
    return res
      .status(404)
      .json({ success: false, message: "Захиалга олдсонгүй" });
  order.status = "accepted";
  await order.save();
  res.status(200).json({ success: true, data: order });
});
exports.declineOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId);
  if (!order)
    return res
      .status(404)
      .json({ success: false, message: "Захиалга олдсонгүй" });
  order.status = "canceled";
  await order.save();
  res.status(200).json({ success: true, data: order });
});
exports.updateStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const allowed = [
    "en_route",
    "started",
    "paid",
    "done",
    "completed",
    "canceled",
  ];
  if (!allowed.includes(status))
    return res.status(400).json({ success: false, message: "Статус буруу" });
  const order = await Order.findByIdAndUpdate(
    orderId,
    { status },
    { new: true }
  );
  res.status(200).json({ success: true, data: order });
});
exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.userId })
    .sort({ createdAt: -1 })
    .populate("service freelancer");
  res.status(200).json({ success: true, data: orders });
});
