const IDAO = require("../interfaces/IDAO");
const mysql = require("../config/mysql");

class WalletDAO extends IDAO {
  async create(data, connection = mysql) {
    const [result] = await connection.query(
      "INSERT INTO wallets (user_id, balance_cents) VALUES (?, ?)",
      [data.user_id, data.balance_cents || 0],
    );

    return this.findById(result.insertId, connection);
  }

  async findById(id, connection = mysql) {
    const [rows] = await connection.query(
      "SELECT id, user_id, balance_cents, created_at, updated_at FROM wallets WHERE id = ?",
      [id],
    );

    return rows[0] || null;
  }

  async findByUserId(userId, connection = mysql, options = {}) {
    const lockSql = options.forUpdate ? " FOR UPDATE" : "";
    const [rows] = await connection.query(
      `SELECT id, user_id, balance_cents, created_at, updated_at
       FROM wallets
       WHERE user_id = ?${lockSql}`,
      [userId],
    );

    return rows[0] || null;
  }

  async findAll(filters = {}) {
    const [rows] = await mysql.query(
      `SELECT id, user_id, balance_cents, created_at, updated_at
       FROM wallets
       ORDER BY id ASC
       LIMIT ?`,
      [Number(filters.limit || 100)],
    );

    return rows;
  }

  async update(id, data, connection = mysql) {
    const fields = [];
    const params = [];

    if (Object.prototype.hasOwnProperty.call(data, "balance_cents")) {
      fields.push("balance_cents = ?");
      params.push(data.balance_cents);
    }

    if (!fields.length) {
      return this.findById(id, connection);
    }

    params.push(id);
    await connection.query(`UPDATE wallets SET ${fields.join(", ")} WHERE id = ?`, params);
    return this.findById(id, connection);
  }

  async credit(id, amountCents, connection = mysql) {
    await connection.query("UPDATE wallets SET balance_cents = balance_cents + ? WHERE id = ?", [
      amountCents,
      id,
    ]);

    return this.findById(id, connection);
  }

  async debit(id, amountCents, connection = mysql) {
    const [result] = await connection.query(
      "UPDATE wallets SET balance_cents = balance_cents - ? WHERE id = ? AND balance_cents >= ?",
      [amountCents, id, amountCents],
    );

    if (result.affectedRows === 0) {
      return null;
    }

    return this.findById(id, connection);
  }

  async delete() {
    throw new Error("Wallets cannot be deleted through WalletDAO");
  }
}

module.exports = WalletDAO;
