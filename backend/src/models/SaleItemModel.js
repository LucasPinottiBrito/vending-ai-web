function normalizeSaleItem(row) {
  if (!row) return null;

  return {
    id: Number(row.id),
    sale_id: Number(row.sale_id),
    product_id: Number(row.product_id),
    slot_id: Number(row.slot_id),
    quantity: Number(row.quantity),
    unit_price_cents: Number(row.unit_price_cents),
    total_cents: Number(row.total_cents),
    product_sku: row.product_sku || null,
    product_name: row.product_name || null,
    slot_code: row.slot_code || null,
    created_at: row.created_at || null,
  };
}

module.exports = {
  normalizeSaleItem,
};
