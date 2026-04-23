/**
 * catchAsync
 * Wraps an async Express handler so that any rejected promise is forwarded
 * to Express's next(err) — eliminating repetitive try/catch blocks in
 * controllers.
 *
 * @param {Function} fn  Async (req, res, next) handler
 * @returns {Function}   Standard Express middleware
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
