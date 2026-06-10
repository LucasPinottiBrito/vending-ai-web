const IDAO = require("../interfaces/IDAO");
const mysql = require("../config/mysql");

const saleItemSelect = `
  SELECT si.id, si.sale_id, si.product_id, si.slot_id, si.quantity,
         si.unit_price_cents, si.total_cents, si.created_at,
         p.sku AS product_sku, p.name AS product_name,
         s.code AS slot_code
  FROM sale_items si
  INNER JOIN products p ON p.id = si.product_id
  INNER JOIN slots s ON s.id = si.slot_id
`;

class SaleItemDAO extends IDAO {
  async create(data, connection = mysql) {
    const [result] = await connection.query(
      `INSERT INTO sale_items
        (sale_id, product_id, slot_id, quantity, unit_price_cents, total_cents)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.sale_id,
        data.product_id,
        data.slot_id,
        data.quantity,
        data.unit_price_cents,
        data.total_cents,
      ],
    );

    return this.findById(result.insertId, connection);
  }

  async findById(id, connection = mysql) {
    const [rows] = await connection.query(
      `${saleItemSelect}
       WHERE si.id = ?`,
      [id],
    );

    return rows[0] || null;
  }

  async findBySaleId(saleId, connection = mysql) {
    const [rows] = await connection.query(
      `${saleItemSelect}
       WHERE si.sale_id = ?
       ORDER BY si.id ASC`,
      [saleId],
    );

    return rows;
  }

  async findAll(filters = {}, connection = mysql) {
    if (filters.sale_id) {
      return this.findBySaleId(filters.sale_id, connection);
    }

    const [rows] = await connection.query(
      `${saleItemSelect}
       ORDER BY si.id DESC
       LIMIT ?`,
      [Number(filters.limit || 100)],
    );

    return rows;
  }

  async update() {
    throw new Error("Sale items are immutable");
  }

  async delete() {
    throw new Error("Sale items cannot be deleted");
  }
}

module.exports = SaleItemDAO;
