const IDAO = require("../interfaces/IDAO");
const mysql = require("../config/mysql");

const saleSelect = `
  SELECT s.id, s.user_id, s.machine_id, s.status, s.payment_method, s.total_cents,
         s.failure_reason, s.created_at, s.updated_at,
         m.slug AS machine_slug, m.name AS machine_name,
         (SELECT p.name FROM sale_items si INNER JOIN products p ON p.id = si.product_id WHERE si.sale_id = s.id LIMIT 1) AS product_name
  FROM sales s
  INNER JOIN machines m ON m.id = s.machine_id
`;

class SaleDAO extends IDAO {
  async create(data, connection = mysql) {
    const [result] = await connection.query(
      `INSERT INTO sales (user_id, machine_id, status, payment_method, total_cents, failure_reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.machine_id,
        data.status,
        data.payment_method || "WALLET",
        data.total_cents,
        data.failure_reason || null,
      ],
    );

    return this.findById(result.insertId, connection);
  }

  async findById(id, connection = mysql) {
    const [rows] = await connection.query(
      `${saleSelect}
       WHERE s.id = ?`,
      [id],
    );

    return rows[0] || null;
  }

  async findByIdForUpdate(id, connection = mysql) {
    const [rows] = await connection.query(
      `${saleSelect}
       WHERE s.id = ?
       FOR UPDATE`,
      [id],
    );

    return rows[0] || null;
  }

  async findAll(filters = {}, connection = mysql) {
    const where = [];
    const params = [];

    if (filters.user_id) {
      where.push("s.user_id = ?");
      params.push(filters.user_id);
    }

    if (filters.status) {
      where.push("s.status = ?");
      params.push(filters.status);
    }

    if (filters.start_date) {
      where.push("s.created_at >= ?");
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      where.push("s.created_at <= ?");
      params.push(filters.end_date);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await connection.query(
      `${saleSelect}
       ${whereSql}
       ORDER BY s.created_at DESC, s.id DESC
       LIMIT ?`,
      [...params, Number(filters.limit || 100)],
    );

    return rows;
  }

  async update(id, data, connection = mysql) {
    const fields = [];
    const params = [];
    const allowedFields = ["status", "failure_reason"];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(data, field)) {
        fields.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (!fields.length) {
      return this.findById(id, connection);
    }

    params.push(id);
    await connection.query(`UPDATE sales SET ${fields.join(", ")} WHERE id = ?`, params);
    return this.findById(id, connection);
  }

  async delete() {
    throw new Error("Sales cannot be deleted");
  }
}

module.exports = SaleDAO;
