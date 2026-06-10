function normalizePayment(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    user_id: Number(row.user_id),
    type: row.type,
    provider: row.provider,
    provider_payment_id: row.provider_payment_id || null,
    amount_cents: Number(row.amount_cents),
    status: row.status,
    mock_qr_code: row.mock_qr_code || null,
    mock_copy_paste: row.mock_copy_paste || null,
    expires_at: row.expires_at || null,
    paid_at: row.paid_at || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

module.exports = {
  normalizePayment,
};
