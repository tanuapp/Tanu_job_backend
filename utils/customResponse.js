function errorResponse(res, data) {
  return res.status(500).json({
    success: false,
    message: data,
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
