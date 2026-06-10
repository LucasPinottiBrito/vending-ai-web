function normalizeMachineEvent(row) {
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
    machine_id: Number(row.machine_id),
    sale_id: row.sale_id === null || row.sale_id === undefined ? null : Number(row.sale_id),
    dispense_command_id:
      row.dispense_command_id === null || row.dispense_command_id === undefined
        ? null
        : Number(row.dispense_command_id),
    event_type: row.event_type,
    payload_json: payload,
    occurred_at: row.occurred_at || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

module.exports = {
  normalizeMachineEvent,
};
