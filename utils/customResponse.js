function errorResponse(res, message, extra = {}) {
  return res.status(400).json({
    success: false,
    message,
    ...extra, // ✅ conflict гэх мэт нэмэлт өгөгдөл front руу дамжина
  });
}

function successResponse(res, data, token) {
  return res.status(200).json({
    success: true,
    data: data,
    token: token ? token : null,
  });
}

function unAuthenticated(res) {
  return res.status(401).json({
    success: false,
    message: "Таны эрх хүрэхгүй байна",
  });
}

function serverError(res, data) {
  return res.status(500).json({
    success: false,
    message: "Серверийн алдаа: " + data,
  });
}

const customResponse = {
  error: errorResponse,
  success: successResponse,
  unAuthenticated,
  server: serverError,
};

module.exports = customResponse;
