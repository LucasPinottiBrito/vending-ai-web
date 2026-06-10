function normalizeInventory(row) {
  if (!row) return null;

  const quantityAvailable = Number(row.quantity_available);
  const quantityReserved = Number(row.quantity_reserved);

  return {
    id: Number(row.id),
    inventory_id: Number(row.id),
    machine_id: Number(row.machine_id),
    slot_id: Number(row.slot_id),
    product_id: Number(row.product_id),
    quantity_available: quantityAvailable,
    quantity_reserved: quantityReserved,
    min_quantity_alert: Number(row.min_quantity_alert),
    available_for_sale: quantityAvailable - quantityReserved,
    slot_code: row.slot_code || null,
    motor_id: row.motor_id === undefined ? null : Number(row.motor_id),
    sensor_column_id: row.sensor_column_id === undefined ? null : Number(row.sensor_column_id),
    product_sku: row.product_sku || null,
    product_name: row.product_name || null,
    product_category: row.product_category || null,
    price_cents: row.price_cents === undefined ? null : Number(row.price_cents),
    image_path: row.image_path || null,
    machine_slug: row.machine_slug || null,
    machine_status: row.machine_status || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

module.exports = {
  normalizeInventory,
};
