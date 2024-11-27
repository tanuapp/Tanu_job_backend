function errorResponse(res, data) {
  return res.status(200).json({
    success: false,
    msg: data,
  });
}

function successResponse(res, data) {
  return res.status(200).json({
    success: true,
    msg: data,
  });
}

function unAuthenticated(res) {
  return res.status(200).json({
    success: false,
    msg: "Таны эрх хүрэхгүй байна",
  });
}

function serverError(res, data) {
  return res.status(200).json({
    success: false,
    msg: "Серверийн алдаа: " + data,
  });
}

// Corrected export syntax
const customResponse = {
  error: errorResponse,
  success: successResponse,
  unAuthenticated,
  server: serverError,
};

module.exports = customResponse;

// export default customResponse;
