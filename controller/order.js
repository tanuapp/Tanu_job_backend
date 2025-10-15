const asyncHandler = require("../middleware/asyncHandler");
const mongoose = require("mongoose");
const Order = require("../models/order");
const Service = require("../models/service");
const Freelancer = require("../models/freelancer");
const Customer = require("../models/customer");
const Notification = require("../models/notification");
const sendFirebaseNotification = require("../utils/sendFIrebaseNotification");

const customResponse = require("../utils/customResponse");

const DISPATCH_LIMIT = 5;
const DISPATCH_EXPIRES_MS = 60 * 1000; // ← та хэлсэн 60сек

// in-memory таймерууд (prod-д BullMQ-р солино)
const dispatchTimers = new Map(); // orderId -> timeoutId

exports.getNearbyFreelancers = asyncHandler(async (req, res) => {
  console.log("===== 📍 GET /freelancer/nearby эхэллээ =====");

  const { lat, lng } = req.query;
  console.log("👉 Ирсэн query:", req.query);

  if (!lat || !lng) {
    console.log("❌ Алдаа: lat/lng ирээгүй байна");
    return res.status(400).json({
      success: false,
      message: "lat/lng параметр шаардлагатай",
    });
  }

  console.log(`✅ lat=${lat}, lng=${lng}`);

  try {
    const freelancers = await Freelancer.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          key: "location",
          distanceField: "dist",
          spherical: true, // ❌ maxDistance байхгүй
          query: { online: true },
        },
      },
      { $sort: { dist: 1, rating_avg: -1 } },
      { $limit: 20 },
    ]);

    console.log("👉 Олдсон freelancers тоо:", freelancers.length);

    if (freelancers.length > 0) {
      console.log("👉 Эхний freelancer:", freelancers[0]);
    } else {
      console.log("⚠️ Нэг ч freelancer олдсонгүй");
    }

    console.log("===== ✅ GET /freelancer/nearby дууслаа =====");
    return res.status(200).json({ success: true, data: freelancers });
  } catch (err) {
    console.error("❌ DB алдаа:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

exports.createOrder = asyncHandler(async (req, res) => {
  console.log("===== 📦 CREATE ORDER эхэллээ =====");
  console.log("👉 req.userId:", req.userId);
  console.log("👉 req.body:", req.body);

  let { serviceId, freelancerId, address, lat, lng, price } = req.body;

  if (!Array.isArray(serviceId)) serviceId = [serviceId].filter(Boolean);
  console.log("👉 Final serviceId array:", serviceId);

  const services = await Service.find({ _id: { $in: serviceId } });
  console.log(
    "👉 Олдсон services:",
    services.map((s) => s._id)
  );

  if (!services.length) {
    return res.status(404).json({
      success: false,
      message: "Үйлчилгээ олдсонгүй",
    });
  }

  const order = await Order.create({
    user: req.userId,
    service: serviceId.length === 1 ? serviceId[0] : serviceId,
    address,
    lat: Number(lat),
    lng: Number(lng),
    price: Number(price) || 0,
    status: freelancerId ? "assigned" : "dispatching",
  });
  console.log("✅ Order created:", order._id);

  // 🔹 Шууд оноох (freelancerId ирсэн)
  if (freelancerId && mongoose.Types.ObjectId.isValid(freelancerId)) {
    console.log("👉 Direct assign to freelancer:", freelancerId);

    order.freelancer = freelancerId;
    order.status = "assigned";
    await order.save();
    await order.populate("service", "service_name");

    const f = await Freelancer.findById(freelancerId);
    const token = f?.firebase_token;

    // 🚩 Direct assign үед ойрын зай тооцох (өөрийнх нь байрлалтай харьцуулж)
    let distance = null;
    if (order.lat && order.lng && f?.location?.coordinates) {
      const [freelancerLng, freelancerLat] = f.location.coordinates;
      const R = 6371; // дэлхийн радиус км
      const dLat = ((freelancerLat - order.lat) * Math.PI) / 180;
      const dLng = ((freelancerLng - order.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(order.lat * (Math.PI / 180)) *
          Math.cos(freelancerLat * (Math.PI / 180)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distance = (R * c).toFixed(1); // км
    }

    // 🔹 Customer info
    const customer = await Customer.findById(req.userId).select(
      "first_name last_name nickName phone"
    );

    if (token) {
      await sendFirebaseNotification({
        token,
        title: "Шинэ захиалга",
        body: "Танд шинэ ажил ирлээ. Хүлээн авах уу?",
        ttlSeconds: Math.ceil(DISPATCH_EXPIRES_MS / 1000),
        data: {
          type: "order_dispatch",
          orderId: order._id,
          service: Array.isArray(order.service)
            ? order.service.map((s) => s.service_name).join(", ")
            : order.service?.service_name ?? "---",
          action: "confirm",
          address: order.address,
          price: order.price,
          lat: order.lat,
          lng: order.lng,
          name: customer?.nickName
            ? customer.nickName
            : `${
                customer?.first_name ? customer.first_name.charAt(0) + "." : ""
              } ${customer?.last_name ?? ""}`,
          phone: customer?.phone ?? "",
          distance: distance ?? "---",
        },
      });

      await Notification.create({
        title: "Шинэ захиалга",
        body: "Танд шинэ ажил ирлээ",
        data: { orderId: order._id, action: "confirm" },
        freelancerId,
      });
    }

    console.log("===== ✅ CREATE ORDER дууслаа (direct assign) =====");
    return res.status(201).json({ success: true, data: order });
  }

  // 🔹 Broadcast — ойрын N онлайн
  const candidates = await Freelancer.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [order.lng, order.lat] },
        key: "location",
        distanceField: "dist",
        maxDistance: 7000,
        spherical: true,
        query: { online: true },
      },
    },
    { $sort: { dist: 1, rating_avg: -1 } },
    { $limit: DISPATCH_LIMIT },
    { $project: { _id: 1, dist: 1 } },
  ]);

  console.log("👉 Candidates found:", candidates.length);

  if (!candidates.length) {
    const user = await Customer.findById(req.userId);
    const token = user?.firebase_token;
    if (token) {
      await sendFirebaseNotification({
        token,
        title: "Хайлт дууслаа",
        body: "Ойрхон онлайн үйлчилгээ үзүүлэгч олдсонгүй.",
        data: { type: "order_info", orderId: order._id, action: "no_provider" },
      });
    }
    return res
      .status(201)
      .json({ success: true, data: order, note: "no candidates" });
  }

  const fls = await Freelancer.find({
    _id: { $in: candidates.map((c) => c._id) },
  }).populate("user");

  const tokens = fls
    .map((f) => f?.user?.firebase_token || f?.firebase_token)
    .filter(Boolean);

  if (tokens.length) {
    await sendFirebaseNotification({
      token: tokens,
      title: "Ойролцоо шинэ захиалга",
      body: "Шинэ ажил ирлээ. Хүлээн авах уу?",
      ttlSeconds: Math.ceil(DISPATCH_EXPIRES_MS / 1000),
      data: {
        type: "order_dispatch",
        orderId: order._id,
        action: "confirm",
        address: order.address,
        price: order.price,
        lat: order.lat,
        lng: order.lng,
      },
    });

    await Notification.create({
      title: "Ойролцоо шинэ захиалга",
      body: "Dispatch round #1",
      data: { orderId: order._id, action: "confirm" },
    });
  }

  // 🔹 Re-dispatch setup
  if (dispatchTimers.has(String(order._id)))
    clearTimeout(dispatchTimers.get(String(order._id)));

  const t = setTimeout(async () => {
    try {
      const fresh = await Order.findById(order._id);
      if (!fresh || fresh.freelancer || fresh.status !== "dispatching") return;

      const more = await Freelancer.find({ online: true })
        .limit(DISPATCH_LIMIT * 2)
        .populate("user");

      const moreTokens = more
        .map((f) => f?.user?.firebase_token || f?.firebase_token)
        .filter(Boolean);

      if (moreTokens.length) {
        await sendFirebaseNotification({
          token: moreTokens,
          title: "Шинэ захиалга (дахин түгээлт)",
          body: "Шинэ ажил бэлэн байна. Хүлээн авна уу?",
          ttlSeconds: Math.ceil(DISPATCH_EXPIRES_MS / 1000),
          data: {
            type: "order_dispatch",
            orderId: fresh._id,
            action: "confirm",
            address: fresh.address,
            price: fresh.price,
            lat: fresh.lat,
            lng: fresh.lng,
          },
        });
      }
    } catch (e) {
      console.error("❌ Re-dispatch error:", e.message);
    } finally {
      dispatchTimers.delete(String(order._id));
    }
  }, DISPATCH_EXPIRES_MS);

  dispatchTimers.set(String(order._id), t);

  console.log("===== ✅ CREATE ORDER дууслаа (broadcast) =====");
  return res.status(201).json({ success: true, data: order });
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
  console.log("===== 🟢 ACCEPT ORDER эхэллээ =====");
  console.log("👉 orderId:", orderId);
  console.log("👉 freelancerId:", req.userId);

  try {
    // зөвхөн хэн ч аваагүй үед “анх авсан”-ыг тэмдэглэнэ
    const updated = await Order.findOneAndUpdate(
      {
        _id: orderId,
        $or: [
          // dispatch үед (freelancer хоосон)
          { freelancer: { $exists: false } },
          { freelancer: null },
          // direct assign үед (freelancer = энэ req.freelancerId)
          { freelancer: req.userId },
        ],
        status: { $in: ["dispatching", "assigned"] },
      },
      { $set: { freelancer: req.userId, status: "accepted" } },
      { new: true }
    ).populate("user service freelancer");

    if (!updated) {
      console.log(
        "❌ Захиалгыг өөр хүн түрүүлж баталгаажуулсан эсвэл буруу статус"
      );
      return res.status(409).json({
        success: false,
        message: "Өөр хүн түрүүлж баталгаажуулсан",
      });
    }

    console.log("✅ Захиалга амжилттай update хийгдлээ:", updated._id);

    // ⏱ in-memory таймер байвал цуцална
    const t = dispatchTimers.get(String(orderId));
    if (t) {
      clearTimeout(t);
      dispatchTimers.delete(String(orderId));
      console.log("🛑 Dispatch таймер цуцлагдлаа:", orderId);
    }

    // Хэрэглэгчид: “accepted”
    const user = await Customer.findById(updated.user);
    console.log("👉 Target customer:", user?._id, user?.firebase_token);

    const userToken = user?.firebase_token;
    if (userToken) {
      console.log("📩 Sending FCM to customer:", userToken);
      await sendFirebaseNotification({
        token: userToken,
        title: "Захиалга баталгаажлаа",
        body: "Таны захиалгыг үйлчилгээ үзүүлэгч хүлээн авлаа.",
        data: {
          type: "order_update",
          orderId: updated._id,
          action: "accepted",
          freelancerId: req.userId,
        },
      });
      console.log("✅ Notification sent to customer:", user._id);
    } else {
      console.log("⚠️ Customer-д firebase_token алга:", user?._id);
    }

    console.log("===== ✅ ACCEPT ORDER дууслаа =====");
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("❌ ACCEPT ORDER алдаа:", err.message);
    return res.status(500).json({
      success: false,
      message: "Алдаа гарлаа",
      error: err.message,
    });
  }
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

exports.getAllModel = asyncHandler(async (req, res, next) => {
  try {
    const result = await Order.find();

    customResponse.success(res, result);
  } catch (error) {
    customResponse.error(res, error.message);
  }
});

exports.getOrderByIds = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.params;


    const orders = await Order.find({
      _id: { $in: orderId },
    })

    orders.forEach((o) => {});

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("❌ [getOrderByIds] Error:", error.message);
    customResponse.error(res, error.message);
  }
});
