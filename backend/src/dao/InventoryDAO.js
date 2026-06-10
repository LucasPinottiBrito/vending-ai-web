const IDAO = require("../interfaces/IDAO");
const mysql = require("../config/mysql");

const inventorySelect = `
  SELECT
    i.id, i.machine_id, i.slot_id, i.product_id, i.quantity_available,
    i.quantity_reserved, i.min_quantity_alert, i.created_at, i.updated_at,
    s.code AS slot_code, s.motor_id, s.sensor_column_id,
    p.sku AS product_sku, p.name AS product_name, p.category AS product_category,
    p.price_cents, p.image_path,
    m.slug AS machine_slug, m.status AS machine_status
  FROM inventory i
  INNER JOIN slots s ON s.id = i.slot_id
  INNER JOIN products p ON p.id = i.product_id
  INNER JOIN machines m ON m.id = i.machine_id
`;

const checkoutInventorySelect = `
  SELECT
    i.id, i.machine_id, i.slot_id, i.product_id, i.quantity_available,
    i.quantity_reserved, i.min_quantity_alert, i.created_at, i.updated_at,
    s.code AS slot_code, s.motor_id, s.sensor_column_id, s.is_enabled AS slot_is_enabled,
    p.sku AS product_sku, p.name AS product_name, p.category AS product_category,
    p.price_cents, p.image_path, p.is_active AS product_is_active,
    m.slug AS machine_slug, m.name AS machine_name, m.status AS machine_status,
    m.is_active AS machine_is_active
  FROM inventory i
  INNER JOIN slots s ON s.id = i.slot_id
  INNER JOIN products p ON p.id = i.product_id
  INNER JOIN machines m ON m.id = i.machine_id
`;

class InventoryDAO extends IDAO {
  async create(data) {
    const [result] = await mysql.query(
      `INSERT INTO inventory
        (machine_id, slot_id, product_id, quantity_available, quantity_reserved, min_quantity_alert)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.machine_id,
        data.slot_id,
        data.product_id,
        data.quantity_available ?? 0,
        data.quantity_reserved ?? 0,
        data.min_quantity_alert ?? 0,
      ],
    );

    return this.findById(result.insertId);
  }

  async findById(id, connection = mysql) {
    const [rows] = await connection.query(
      `${inventorySelect}
       WHERE i.id = ?`,
      [id],
    );

    return rows[0] || null;
  }

  async findBySlotId(slotId, connection = mysql) {
    const [rows] = await connection.query(
      `${inventorySelect}
       WHERE i.slot_id = ?`,
      [slotId],
    );

    return rows[0] || null;
  }

  async findForCheckout({ machine_id, slot_id, product_id }, connection = mysql, options = {}) {
    const lockSql = options.forUpdate ? " FOR UPDATE" : "";
    const [rows] = await connection.query(
      `${checkoutInventorySelect}
       WHERE i.machine_id = ?
         AND i.slot_id = ?
         AND i.product_id = ?${lockSql}`,
      [machine_id, slot_id, product_id],
    );

    return rows[0] || null;
  }

  async findAll(filters = {}) {
    const where = [];
    const params = [];

    if (filters.machine_id) {
      where.push("i.machine_id = ?");
      params.push(filters.machine_id);
    }

    if (filters.product_id) {
      where.push("i.product_id = ?");
      params.push(filters.product_id);
    }

    if (filters.low_stock === "true") {
      where.push("i.quantity_available - i.quantity_reserved <= i.min_quantity_alert");
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await mysql.query(
      `${inventorySelect}
       ${whereSql}
       ORDER BY m.name ASC, s.code ASC
       LIMIT ?`,
      [...params, Number(filters.limit || 100)],
    );

    return rows;
  }

  async findByMachineId(machineId) {
    return this.findAll({ machine_id: machineId, limit: 500 });
  }

  async findCatalogByMachineId(machineId) {
    const [rows] = await mysql.query(
      `${inventorySelect}
       WHERE i.machine_id = ?
         AND s.is_enabled = 1
         AND p.is_active = 1
       ORDER BY s.code ASC`,
      [machineId],
    );

    return rows;
  }

  async update(id, data, connection = mysql) {
    const fields = [];
    const params = [];
    const allowedFields = [
      "machine_id",
      "slot_id",
      "product_id",
      "quantity_available",
      "quantity_reserved",
      "min_quantity_alert",
    ];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(data, field)) {
        fields.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (!fields.length) {
      return this.findById(id);
    }

    params.push(id);
    await connection.query(`UPDATE inventory SET ${fields.join(", ")} WHERE id = ?`, params);
    return this.findById(id, connection);
  }

  async adjust(id, data, connection = mysql) {
    await connection.query(
      `UPDATE inventory
       SET quantity_available = quantity_available + ?,
           quantity_reserved = quantity_reserved + ?
       WHERE id = ?`,
      [data.quantity_available_delta || 0, data.quantity_reserved_delta || 0, id],
    );

    return this.findById(id, connection);
  }

  async reserve(id, quantity, connection = mysql) {
    const [result] = await connection.query(
      `UPDATE inventory
       SET quantity_reserved = quantity_reserved + ?
       WHERE id = ?
         AND quantity_available - quantity_reserved >= ?`,
      [quantity, id, quantity],
    );

    if (result.affectedRows === 0) {
      return null;
    }

    return this.findById(id, connection);
  }

  async finalizeReserved(id, quantity, connection = mysql) {
    const [result] = await connection.query(
      `UPDATE inventory
       SET quantity_available = quantity_available - ?,
           quantity_reserved = quantity_reserved - ?
       WHERE id = ?
         AND quantity_available >= ?
         AND quantity_reserved >= ?`,
      [quantity, quantity, id, quantity, quantity],
    );

    if (result.affectedRows === 0) {
      return null;
    }

    return this.findById(id, connection);
  }

  async releaseReserved(id, quantity, connection = mysql) {
    const [result] = await connection.query(
      `UPDATE inventory
       SET quantity_reserved = quantity_reserved - ?
       WHERE id = ?
         AND quantity_reserved >= ?`,
      [quantity, id, quantity],
    );

    if (result.affectedRows === 0) {
      return null;
    }

    return this.findById(id, connection);
  }

  async delete() {
    throw new Error("Inventory records are adjusted or replaced, not deleted in this API");
  }
}

module.exports = InventoryDAO;
