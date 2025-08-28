import Appointment from "../models/appointment.js";
import Schedule from "../models/schedule.js";
import Invoice from "../models/invoice.js";
import Customer from "../models/customer.js";
import asyncHandler from "../middleware/asyncHandler.js";
import customResponse from "../utils/customResponse.js";
import axios from "axios";
import {
  calculateDiscountedTotal,
  saveFavourite,
  sendAndSaveNotification,
  generateQR,
} from "../utils/paymentHelpers.js";

export const createPayment = asyncHandler(async (req, res) => {
  try {
    const { schedule, date } = req.body;
    const scheduleDoc = await Schedule.findById(schedule)
      .populate("artistId")
      .populate({
        path: "serviceId",
        select:
          "service_name price companyId discount discountStart discountEnd",
        populate: {
          path: "companyId",
          model: "Company",
          select: "advancePayment firebase_token name",
        },
      });

    if (!scheduleDoc) return customResponse.error(res, "Schedule олдсонгүй");
    const services = scheduleDoc.serviceId;
    const company = services[0]?.companyId;
    if (!company) return customResponse.error(res, "Компани олдсонгүй");

    const discountedTotalPrice = calculateDiscountedTotal(services);
    const advancePercent = parseFloat(company.advancePayment || 0);
    const advanceAmount = Math.floor(
      (discountedTotalPrice * advancePercent) / 100
    );

    // ✅ Appointment үүсгэнэ
    const app = await Appointment.create({
      schedule,
      user: req.userId || null,
      date,
      finalPrice: discountedTotalPrice,
      company: company._id,
      status: advanceAmount === 0 ? "pending" : "advance",
    });

    await saveFavourite(req.userId, company._id);

    const fullUser = await Customer.findById(app.user);
    const userName = `${fullUser?.last_name || ""}`.trim() || "Үл мэдэгдэх";
    const userPhone = fullUser?.phone || "N/A";

    // ✅ Notification -> Company
    await sendAndSaveNotification({
      title: "Шинэ захиалга",
      body: "Таны компанид шинэ захиалга ирлээ!",
      token: company.firebase_token,
      data: {
        type: advanceAmount === 0 ? "appointment" : "advancedPayment",
        id: app._id.toString(),
        name: userName,
        phone: userPhone,
        date,
        time: scheduleDoc.start || "00:00",
        service: services.map((s) => s.service_name).join(", "),
      },
      companyId: company._id,
      appointmentId: app._id,
    });

    // ✅ Notification -> Artist
    if (scheduleDoc.artistId) {
      await sendAndSaveNotification({
        title: "Танд шинэ захиалга ирлээ",
        body: `Хэрэглэгч ${userName} ${services
          .map((s) => s.service_name)
          .join(", ")} үйлчилгээ захиаллаа.`,
        token: scheduleDoc.artistId.firebase_token,
        data: {
          type: "appointment",
          id: app._id.toString(),
          name: userName,
          phone: userPhone,
          date,
          time: scheduleDoc.start || "00:00",
          service: services.map((s) => s.service_name).join(", "),
        },
        companyId: company._id,
        artistId: scheduleDoc.artistId._id,
        appointmentId: app._id,
      });
    }

    // ✅ QR code only when advance
    if (advanceAmount > 0) {
      await generateQR(app);
      const inv = await Invoice.create({
        amount: advanceAmount,
        appointment: app._id,
        isAdvance: true,
      });

      const duk = await axios.post(
        `http://localhost:9090/api/v1/qpay/${inv._id}`,
        {},
        { headers: { Authorization: `Bearer ${req.token}` } }
      );

      return res.status(200).json({
        success: true,
        data: duk.data.data,
        invoice: duk.data.invoice.sender_invoice_id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Artist баталгаажуулалт хүлээгдэж байна",
      appointmentId: app._id,
    });
  } catch (error) {
    console.error("❌ createPayment error:", error.message);
    return customResponse.error(res, error.message);
  }
});
