const IDAO = require("../interfaces/IDAO");
const mysql = require("../config/mysql");

class ProductDAO extends IDAO {
  async create(data) {
    const [result] = await mysql.query(
      `INSERT INTO products (sku, name, description, category, price_cents, image_path, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.sku,
        data.name,
        data.description || null,
        data.category || null,
        data.price_cents,
        data.image_path || null,
        data.is_active ?? 1,
      ],
    );

    return this.findById(result.insertId);
  }

  async findById(id) {
    const [rows] = await mysql.query(
      `SELECT id, sku, name, description, category, price_cents, image_path, is_active, created_at, updated_at
       FROM products
       WHERE id = ?`,
      [id],
    );

    return rows[0] || null;
  }

  async findBySku(sku) {
    const [rows] = await mysql.query(
      `SELECT id, sku, name, description, category, price_cents, image_path, is_active, created_at, updated_at
       FROM products
       WHERE sku = ?`,
      [sku],
    );

    return rows[0] || null;
  }

  async findAll(filters = {}) {
    const where = [];
    const params = [];

    if (filters.search) {
      where.push("name LIKE ?");
      params.push(`%${filters.search}%`);
    }

    if (filters.category) {
      where.push("category = ?");
      params.push(filters.category);
    }

    if (filters.status === "active") {
      where.push("is_active = 1");
    }

    if (filters.status === "inactive") {
      where.push("is_active = 0");
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await mysql.query(
      `SELECT id, sku, name, description, category, price_cents, image_path, is_active, created_at, updated_at
       FROM products
       ${whereSql}
       ORDER BY name ASC
       LIMIT ?`,
      [...params, Number(filters.limit || 100)],
    );

    return rows;
  }

  async update(id, data) {
    const fields = [];
    const params = [];
    const allowedFields = [
      "sku",
      "name",
      "description",
      "category",
      "price_cents",
      "image_path",
      "is_active",
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
    await mysql.query(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`, params);

    return this.findById(id);
  }

  async delete(id) {
    await mysql.query("UPDATE products SET is_active = 0 WHERE id = ?", [id]);
    return this.findById(id);
  }
}

module.exports = ProductDAO;
