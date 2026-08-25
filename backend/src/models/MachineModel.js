const HEARTBEAT_FRESHNESS_MS = 60 * 1000;

function isHeartbeatFresh(value, now = new Date()) {
  if (!value) return false;

  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (Number.isNaN(timestamp)) return false;

  return now.getTime() - timestamp <= HEARTBEAT_FRESHNESS_MS;
}

function normalizeMachine(row) {
  if (!row) return null;

  const isActive = Boolean(row.is_active);
  const status = row.status || "OFFLINE";
  const heartbeatFresh = isHeartbeatFresh(row.last_seen_at);

  return {
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    location: row.location || null,
    status,
    mqtt_base_topic: row.mqtt_base_topic || null,
    last_seen_at: row.last_seen_at || null,
    firmware_version: row.firmware_version || null,
    is_active: isActive,
    heartbeat_fresh: heartbeatFresh,
    can_sell: isActive && status === "ONLINE" && heartbeatFresh,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

module.exports = {
  HEARTBEAT_FRESHNESS_MS,
  isHeartbeatFresh,
  normalizeMachine,
};
