const multer = require("multer");

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Create the multer instance
const upload = multer({
  storage: storage,
  limits: {
    fieldSize: 300 * 1024 * 1024,
    fileSize: 300 * 1024 * 1024,
    fieldNameSize: 300 * 1024 * 1024,
  },
});

module.exports = upload;
