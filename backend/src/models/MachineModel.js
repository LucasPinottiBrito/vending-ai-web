function normalizeMachine(row) {
  if (!row) return null;

  const isActive = Boolean(row.is_active);
  const status = row.status || "OFFLINE";

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
    can_sell: isActive && status === "ONLINE",
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

module.exports = {
  normalizeMachine,
};
