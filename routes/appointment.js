const express = require("express");
const { protect } = require("../middleware/protect");
const {
  create,
  get,
  getAll,
  getAllPopulated,
  update,
  deleteModel,
  endAppointment,
  declineAppointment,
  getAvailableTimes,
  getArtistAppointments,
  getBookedTimesForArtist,
  updateStatus,
  checkAppointment,
  markCashPaid,
  getCompanyAppointments,
} = require("../controller/appointment");

const router = express.Router();

// Хэрэглэгчийн захиалгуудыг татах
router.route("/artist").get(protect, getArtistAppointments);
router.route("/company").get(protect, getCompanyAppointments);

// Захиалгыг дуусгах
router.route("/end/:id").post(endAppointment);

// Захиалгыг цуцлах
router.route("/decline/:id").post(declineAppointment);

// Захиалгатай (booked) цагуудыг авах
router.route("/booked").get(getBookedTimesForArtist);

// Боломжит (available) цагуудыг авах
router.route("/available").post(getAvailableTimes);

// Захиалгуудыг populate хийн харуулах
router.route("/populated").get(getAllPopulated);

// Бүх захиалгууд болон шинэ захиалга үүсгэх
router.route("/").post(protect, create).get(getAll);

// Тухайн ID-тай захиалгыг харах, засах, устгах (хамгийн сүүлд байх ёстой)
router.route("/:id").put(protect, update).delete(protect, deleteModel).get(get);
router.route("/update/:id").post(protect, updateStatus); // ✅ зөв синтакс + POST method
router.route("/check/:id").get(checkAppointment); // 🆕 нэмэгдсэн route
router.route("/cash/:id").put(markCashPaid);

module.exports = router;
