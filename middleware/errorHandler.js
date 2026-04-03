const { sendError } = require('../utils/response');
const { AppError } = require('../utils/errors');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }
  console.error(err);
  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error';
  return sendError(res, message, 500);
}

module.exports = errorHandler;
