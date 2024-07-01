const asyncHandler = (fn) => (req, res, next) => {
  try {
    Promise.resolve(fn(req, res, next)).catch(next);
  } catch (error) {
    next(error);
  }
};

module.exports = asyncHandler;
