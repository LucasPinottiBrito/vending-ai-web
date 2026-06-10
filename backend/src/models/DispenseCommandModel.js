function normalizeDispenseCommand(row) {
  if (!row) return null;

  let payload = row.payload_json || null;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = row.payload_json;
    }
  }

  return {
    id: Number(row.id),
    command_uuid: row.command_uuid || null,
    sale_id: Number(row.sale_id),
    machine_id: Number(row.machine_id),
    product_id: Number(row.product_id),
    slot_id: Number(row.slot_id),
    motor_id: Number(row.motor_id),
    sensor_column_id: Number(row.sensor_column_id),
    status: row.status,
    mqtt_topic: row.mqtt_topic || null,
    payload_json: payload,
    attempts_allowed: Number(row.attempts_allowed),
    attempts_reported: Number(row.attempts_reported),
    last_error: row.last_error || null,
    published_at: row.published_at || null,
    completed_at: row.completed_at || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

module.exports = {
  normalizeDispenseCommand,
};
