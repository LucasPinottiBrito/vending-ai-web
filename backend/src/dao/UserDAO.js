const IDAO = require("../interfaces/IDAO");
const mysql = require("../config/mysql");

class UserDAO extends IDAO {
  async create(data) {
    const pool = mysql.getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [userResult] = await connection.execute(
        `INSERT INTO users (name, email, password_hash, role, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        [data.name, data.email, data.password_hash, data.role || "USER", data.is_active ?? 1],
      );

      const userId = userResult.insertId;

      await connection.execute(
        `INSERT INTO wallets (user_id, balance_cents)
         VALUES (?, 0)`,
        [userId],
      );

      await connection.commit();
      return this.findById(userId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findById(id) {
    const [rows] = await mysql.query(
      `SELECT id, name, email, password_hash, role, is_active, created_at, updated_at
       FROM users
       WHERE id = ?`,
      [id],
    );

    return rows[0] || null;
  }

  async findByEmail(email) {
    const [rows] = await mysql.query(
      `SELECT id, name, email, password_hash, role, is_active, created_at, updated_at
       FROM users
       WHERE email = ?`,
      [email],
    );

    return rows[0] || null;
  }

  async findAll(filters = {}) {
    const params = [];
    const where = [];

    if (filters.email) {
      where.push("email = ?");
      params.push(filters.email);
    }

    if (filters.role) {
      where.push("role = ?");
      params.push(filters.role);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await mysql.query(
      `SELECT id, name, email, role, is_active, created_at, updated_at
       FROM users
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT ?`,
      [...params, Number(filters.limit || 100)],
    );

    return rows;
  }

  async update(id, data) {
    const fields = [];
    const params = [];

    for (const field of ["name", "email", "password_hash", "role", "is_active"]) {
      if (Object.prototype.hasOwnProperty.call(data, field)) {
        fields.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (!fields.length) {
      return this.findById(id);
    }

    params.push(id);
    await mysql.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, params);

    return this.findById(id);
  }

  async delete(id) {
    await mysql.query("UPDATE users SET is_active = 0 WHERE id = ?", [id]);
    return this.findById(id);
  }
}

module.exports = UserDAO;
