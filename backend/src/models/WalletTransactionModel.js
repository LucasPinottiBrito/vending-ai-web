function normalizeWalletTransaction(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    wallet_id: Number(row.wallet_id),
    user_id: Number(row.user_id),
    sale_id: row.sale_id === null || row.sale_id === undefined ? null : Number(row.sale_id),
    payment_id: row.payment_id === null || row.payment_id === undefined ? null : Number(row.payment_id),
    type: row.type,
    amount_cents: Number(row.amount_cents),
    status: row.status,
    reference_type: row.reference_type || null,
    reference_id: row.reference_id === null || row.reference_id === undefined ? null : Number(row.reference_id),
    description: row.description || null,
    created_at: row.created_at || null,
  };
}

module.exports = {
  normalizeWalletTransaction,
};
