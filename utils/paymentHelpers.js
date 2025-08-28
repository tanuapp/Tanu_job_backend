import Favourite from "../models/favourite.js";
import Notification from "../models/notification.js";
import sendFirebaseNotification from "./sendFIrebaseNotification.js";
import QRCode from "qrcode";
import path from "path";

// ✅ Discount price тооцоолох
export function calculateDiscountedTotal(services) {
  let discountedTotalPrice = 0;

  services.forEach((service) => {
    const price = parseFloat(service.price || 0);
    let serviceFinalPrice = price;

    const discountActive =
      service.discountStart &&
      service.discountEnd &&
      new Date() >= new Date(service.discountStart) &&
      new Date() <= new Date(service.discountEnd);

    if (discountActive && service.discount) {
      const discountPercent = parseFloat(
        service.discount.replace(/[^0-9]/g, "")
      );
      if (!isNaN(discountPercent) && discountPercent > 0) {
        serviceFinalPrice = price * (1 - discountPercent / 100);
      }
    }
    discountedTotalPrice += serviceFinalPrice;
  });

  return discountedTotalPrice;
}

// ✅ Favourite хадгалах
export async function saveFavourite(userId, companyId) {
  const alreadySaved = await Favourite.findOne({
    user: userId,
    company: companyId,
  });
  if (!alreadySaved) {
    await Favourite.create({ user: userId, company: companyId });
    console.log("💾 Company saved to favourites");
  } else {
    console.log("ℹ️ Company already in favourites");
  }
}

// ✅ Notification илгээж DB-д хадгалах
export async function sendAndSaveNotification({
  title,
  body,
  token,
  data,
  companyId,
  artistId,
  appointmentId,
}) {
  if (token) {
    await sendFirebaseNotification({ title, body, token, data });
  }
  await Notification.create({
    title,
    body,
    data,
    companyId,
    artistId,
    appointmentId,
  });
}

// ✅ QR код үүсгэх
export async function generateQR(app) {
  const qrData = `Appointment ID: ${app._id}\nDate: ${app.date}\nUser ID: ${app.user}`;
  const qrFilePath = path.join(
    __dirname,
    "../public/uploads/",
    `${app._id}-qr.png`
  );
  await QRCode.toFile(qrFilePath, qrData);
  app.qr = `${app._id}-qr.png`;
  await app.save();
  return app.qr;
}
