function sendSuccess(res, data = null, message = "Success", statusCode = 200, meta = null) {
  const payload = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
}

function buildErrorPayload(message, code, details = null) {
  return {
    success: false,
    message,
    error: {
      code,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}

function sendError(res, error, statusCode = 500) {
  return res.status(statusCode).json(
    buildErrorPayload(
      error.message || "Internal server error",
      error.code || "INTERNAL_SERVER_ERROR",
      error.details || null,
    ),
  );
}

module.exports = {
  sendSuccess,
  sendError,
  buildErrorPayload,
};
