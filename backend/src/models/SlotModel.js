function normalizeSlot(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    machine_id: Number(row.machine_id),
    code: row.code,
    motor_id: Number(row.motor_id),
    sensor_column_id: Number(row.sensor_column_id),
    is_enabled: Boolean(row.is_enabled),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

module.exports = {
  normalizeSlot,
};
