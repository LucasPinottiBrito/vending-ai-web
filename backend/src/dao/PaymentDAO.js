const IDAO = require("../interfaces/IDAO");
const mysql = require("../config/mysql");

class PaymentDAO extends IDAO {
  async create(data, connection = mysql) {
    const [result] = await connection.query(
      `INSERT INTO payments
        (user_id, type, provider, provider_payment_id, amount_cents, status, mock_qr_code,
         mock_copy_paste, expires_at, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.type,
        data.provider || "MOCK",
        data.provider_payment_id || null,
        data.amount_cents,
        data.status,
        data.mock_qr_code || null,
        data.mock_copy_paste || null,
        data.expires_at || null,
        data.paid_at || null,
      ],
    );

    return this.findById(result.insertId, connection);
  }

  async findById(id, connection = mysql, options = {}) {
    const lockSql = options.forUpdate ? " FOR UPDATE" : "";
    const [rows] = await connection.query(
      `SELECT id, user_id, type, provider, provider_payment_id, amount_cents, status,
              mock_qr_code, mock_copy_paste, expires_at, paid_at, created_at, updated_at
       FROM payments
       WHERE id = ?${lockSql}`,
      [id],
    );

    return rows[0] || null;
  }

  async findAll(filters = {}) {
    const where = [];
    const params = [];

    if (filters.search) {
      where.push("(u.name LIKE ? OR u.email LIKE ? OR p.provider_payment_id LIKE ?)");
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.user_id) {
      where.push("p.user_id = ?");
      params.push(filters.user_id);
    }

    if (filters.status && filters.status !== "all") {
      where.push("p.status = ?");
      params.push(filters.status);
    }

    if (filters.type && filters.type !== "all") {
      where.push("p.type = ?");
      params.push(filters.type);
    }

    if (filters.start_date) {
      where.push("p.created_at >= ?");
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      where.push("p.created_at <= ?");
      params.push(filters.end_date);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await mysql.query(
      `SELECT p.id, p.user_id, p.type, p.provider, p.provider_payment_id, p.amount_cents, p.status,
              p.mock_qr_code, p.mock_copy_paste, p.expires_at, p.paid_at, p.created_at, p.updated_at,
              u.name AS user_name, u.email AS user_email
       FROM payments p
       INNER JOIN users u ON u.id = p.user_id
       ${whereSql}
       ORDER BY p.created_at DESC, p.id DESC
       LIMIT ?`,
      [...params, Number(filters.limit || 100)],
    );

    return rows;
  }

  async update(id, data, connection = mysql) {
    const fields = [];
    const params = [];
    const allowedFields = ["status", "paid_at", "expires_at", "mock_qr_code", "mock_copy_paste"];

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
    await connection.query(`UPDATE payments SET ${fields.join(", ")} WHERE id = ?`, params);
    return this.findById(id, connection);
  }

  async delete() {
    throw new Error("Payments cannot be deleted through PaymentDAO");
  }
}

module.exports = PaymentDAO;
