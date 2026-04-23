/**
 * AppError
 * A structured operational error that carries an HTTP status code.
 * Thrown from services/controllers and caught by the global error handler.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;          // distinguishes our errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
