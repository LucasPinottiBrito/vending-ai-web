const IDAO = require("../interfaces/IDAO");
const mysql = require("../config/mysql");

class WalletTransactionDAO extends IDAO {
  async create(data, connection = mysql) {
    const [result] = await connection.query(
      `INSERT INTO wallet_transactions
        (wallet_id, user_id, sale_id, payment_id, type, amount_cents, status, reference_type, reference_id, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.wallet_id,
        data.user_id,
        data.sale_id || null,
        data.payment_id || null,
        data.type,
        data.amount_cents,
        data.status,
        data.reference_type || null,
        data.reference_id || null,
        data.description || null,
      ],
    );

    return this.findById(result.insertId, connection);
  }

  async findById(id, connection = mysql) {
    const [rows] = await connection.query(
      `SELECT id, wallet_id, user_id, sale_id, payment_id, type, amount_cents,
              status, reference_type, reference_id, description, created_at
       FROM wallet_transactions
       WHERE id = ?`,
      [id],
    );

    return rows[0] || null;
  }

  async findByPaymentId(paymentId, connection = mysql) {
    const [rows] = await connection.query(
      `SELECT id, wallet_id, user_id, sale_id, payment_id, type, amount_cents,
              status, reference_type, reference_id, description, created_at
       FROM wallet_transactions
       WHERE payment_id = ?
       ORDER BY id ASC`,
      [paymentId],
    );

    return rows;
  }

  async findBySaleId(saleId, connection = mysql) {
    const [rows] = await connection.query(
      `SELECT id, wallet_id, user_id, sale_id, payment_id, type, amount_cents,
              status, reference_type, reference_id, description, created_at
       FROM wallet_transactions
       WHERE sale_id = ?
       ORDER BY id ASC`,
      [saleId],
    );

    return rows;
  }

  async findAll(filters = {}) {
    const where = [];
    const params = [];

    if (filters.wallet_id) {
      where.push("wallet_id = ?");
      params.push(filters.wallet_id);
    }

    if (filters.user_id) {
      where.push("user_id = ?");
      params.push(filters.user_id);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await mysql.query(
      `SELECT id, wallet_id, user_id, sale_id, payment_id, type, amount_cents,
              status, reference_type, reference_id, description, created_at
       FROM wallet_transactions
       ${whereSql}
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
      [...params, Number(filters.limit || 100)],
    );

    return rows;
  }

  async update() {
    throw new Error("Wallet transactions are immutable");
  }

  async delete() {
    throw new Error("Wallet transactions cannot be deleted");
  }
}

module.exports = WalletTransactionDAO;
