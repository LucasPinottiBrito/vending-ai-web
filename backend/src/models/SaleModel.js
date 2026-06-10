function normalizeSale(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    user_id: Number(row.user_id),
    machine_id: Number(row.machine_id),
    status: row.status,
    payment_method: row.payment_method,
    total_cents: Number(row.total_cents),
    failure_reason: row.failure_reason || null,
    machine_slug: row.machine_slug || null,
    machine_name: row.machine_name || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

module.exports = {
  normalizeSale,
};
