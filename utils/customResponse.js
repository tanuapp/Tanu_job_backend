function errorResponse(res, data) {
  return res.status(500).json({
    success: false,
    message: data,
  });
}

function successResponse(res, data, token) {
  return res.status(200).json({
    success: true,
<<<<<<< HEAD
    data: data,
=======
    msg: data,
>>>>>>> ebc9545e48a215925418cb7785a6011516689074
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

// Corrected export syntax
const customResponse = {
  error: errorResponse,
  success: successResponse,
  unAuthenticated,
  server: serverError,
};

module.exports = customResponse;

// export default customResponse;
