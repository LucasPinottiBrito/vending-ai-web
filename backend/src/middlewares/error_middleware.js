const ApiError = require("../utils/ApiError");
const { sendError } = require("../utils/response");
const LogService = require("../services/LogService");

const logService = new LogService();

function getStatusCode(error) {
  if (error instanceof ApiError) {
    return error.statusCode;
  }

  if (Number.isInteger(error.statusCode)) {
    return error.statusCode;
  }

  return 500;
}

function errorMiddleware(error, req, res, next) {
  const statusCode = getStatusCode(error);
  const isOperational = error instanceof ApiError || error.isOperational;
  const normalizedError =
    error instanceof ApiError
      ? error
      : new ApiError(statusCode, "Internal server error", "INTERNAL_SERVER_ERROR");

  if (!isOperational && process.env.NODE_ENV !== "production") {
    normalizedError.details = { original_message: error.message };
  }

  logService
    .create({
      event_type: isOperational ? "ERROR" : "EXCEPTION",
      action: `${req.method} ${req.originalUrl}`,
      method: req.method,
      endpoint: req.originalUrl,
      status_code: statusCode,
      response_time_ms: null,
      ip: req.ip,
      user_agent: req.get("user-agent") || null,
      user_id: req.user?.id || req.user?.user_id || null,
      username: req.user?.email || req.user?.username || null,
      details: normalizedError.details || {},
      error: {
        name: error.name || "Error",
        message: error.message || "Internal server error",
      },
      stack_trace: error.stack || null,
    })
    .catch(() => {});

  return sendError(res, normalizedError, statusCode);
}

module.exports = errorMiddleware;
