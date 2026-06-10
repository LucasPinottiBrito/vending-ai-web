const ALLOWED_LOG_EVENTS = new Set([
  "LOGIN_SUCCESS",
  "LOGIN_FAILURE",
  "LOGOUT",
  "REQUEST_ACCESS",
  "CREATE",
  "UPDATE",
  "DELETE",
  "ERROR",
  "EXCEPTION",
  "IMPORT_JSON",
  "EXPORT_JSON",
  "EXPORT_XML",
  "GENERATE_PDF_REPORT",
  "GENERATE_CHART_DATA",
]);

function normalizeLogDocument(log) {
  const eventType = log.event_type || "REQUEST_ACCESS";

  if (!ALLOWED_LOG_EVENTS.has(eventType)) {
    throw new Error(`Invalid log event type: ${eventType}`);
  }

  return {
    timestamp: log.timestamp || new Date(),
    event_type: eventType,
    action: log.action || null,
    user_id: log.user_id || null,
    username: log.username || null,
    method: log.method || null,
    endpoint: log.endpoint || null,
    status_code: log.status_code || null,
    response_time_ms: log.response_time_ms || null,
    ip: log.ip || null,
    user_agent: log.user_agent || null,
    table: log.table || null,
    record_id: log.record_id || null,
    before: log.before || null,
    after: log.after || null,
    details: log.details || {},
    error: log.error || null,
    stack_trace: log.stack_trace || null,
  };
}

module.exports = {
  ALLOWED_LOG_EVENTS,
  normalizeLogDocument,
};
