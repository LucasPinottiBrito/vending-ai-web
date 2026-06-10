const LogService = require("../services/LogService");

const logService = new LogService();

function sanitizeUser(user) {
  if (!user) {
    return { user_id: null, username: null };
  }

  return {
    user_id: user.id || user.user_id || null,
    username: user.email || user.username || null,
  };
}

function logMiddleware(req, res, next) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const user = sanitizeUser(req.user);

    logService
      .create({
        event_type: "REQUEST_ACCESS",
        action: `${req.method} ${req.originalUrl}`,
        method: req.method,
        endpoint: req.originalUrl,
        status_code: res.statusCode,
        response_time_ms: Math.round(elapsedMs),
        ip: req.ip,
        user_agent: req.get("user-agent") || null,
        user_id: user.user_id,
        username: user.username,
        details: {},
      })
      .catch(() => {});
  });

  return next();
}

module.exports = logMiddleware;
