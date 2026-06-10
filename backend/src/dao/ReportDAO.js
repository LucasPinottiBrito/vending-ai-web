const IDAO = require("../interfaces/IDAO");
const mysql = require("../config/mysql");

const saleFields = `
  s.id,
  s.user_id,
  u.name AS user_name,
  u.email AS user_email,
  s.machine_id,
  m.slug AS machine_slug,
  m.name AS machine_name,
  s.status,
  s.payment_method,
  s.total_cents,
  s.failure_reason,
  s.created_at,
  s.updated_at
`;

class ReportDAO extends IDAO {
  async create() {
    throw new Error("ReportDAO.create is not supported");
  }

  async findById() {
    throw new Error("ReportDAO.findById is not supported");
  }

  async findAll(filters = {}) {
    return this.findSales(filters);
  }

  async update() {
    throw new Error("ReportDAO.update is not supported");
  }

  async delete() {
    throw new Error("ReportDAO.delete is not supported");
  }

  buildSalesWhere(filters = {}) {
    const where = [];
    const params = [];

    if (filters.start_date) {
      where.push("s.created_at >= ?");
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      where.push("s.created_at <= ?");
      params.push(filters.end_date);
    }

    if (filters.machine_id) {
      where.push("s.machine_id = ?");
      params.push(Number(filters.machine_id));
    }

    if (filters.status) {
      where.push("s.status = ?");
      params.push(filters.status);
    }

    if (filters.user_id) {
      where.push("s.user_id = ?");
      params.push(Number(filters.user_id));
    }

    return {
      whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "",
      params,
    };
  }

  async findSales(filters = {}) {
    const { whereSql, params } = this.buildSalesWhere(filters);
    const [rows] = await mysql.query(
      `SELECT ${saleFields}
       FROM sales s
       INNER JOIN users u ON u.id = s.user_id
       INNER JOIN machines m ON m.id = s.machine_id
       ${whereSql}
       ORDER BY s.created_at ASC, s.id ASC
       LIMIT ?`,
      [...params, Number(filters.limit || 1000)],
    );

    return rows;
  }

  async getSalesSummary(filters = {}) {
    const { whereSql, params } = this.buildSalesWhere(filters);
    const [rows] = await mysql.query(
      `SELECT
         COUNT(*) AS sales_count,
         COALESCE(SUM(s.total_cents), 0) AS total_sold_cents,
         COALESCE(SUM(CASE WHEN s.status = 'FAILED' THEN 1 ELSE 0 END), 0) AS failure_count,
         COALESCE(SUM(CASE WHEN s.status = 'REFUNDED' THEN 1 ELSE 0 END), 0) AS refund_count
       FROM sales s
       ${whereSql}`,
      params,
    );

    return rows[0];
  }

  async findSaleItemsBySaleIds(saleIds = []) {
    if (!saleIds.length) {
      return [];
    }

    const [rows] = await mysql.query(
      `SELECT
         si.id,
         si.sale_id,
         si.product_id,
         p.sku AS product_sku,
         p.name AS product_name,
         si.slot_id,
         sl.code AS slot_code,
         si.quantity,
         si.unit_price_cents,
         si.total_cents,
         si.created_at
       FROM sale_items si
       INNER JOIN products p ON p.id = si.product_id
       INNER JOIN slots sl ON sl.id = si.slot_id
       WHERE si.sale_id IN (?)
       ORDER BY si.sale_id ASC, si.id ASC`,
      [saleIds],
    );

    return rows;
  }

  async findSalesByMonth(filters = {}) {
    const where = [];
    const params = [];

    if (filters.year) {
      where.push("YEAR(s.created_at) = ?");
      params.push(Number(filters.year));
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await mysql.query(
      `SELECT
         DATE_FORMAT(s.created_at, '%Y-%m') AS month,
         COUNT(*) AS sales_count,
         COALESCE(SUM(s.total_cents), 0) AS total_sold_cents,
         COALESCE(SUM(CASE WHEN s.status = 'FAILED' THEN 1 ELSE 0 END), 0) AS failure_count,
         COALESCE(SUM(CASE WHEN s.status = 'REFUNDED' THEN 1 ELSE 0 END), 0) AS refund_count
       FROM sales s
       ${whereSql}
       GROUP BY DATE_FORMAT(s.created_at, '%Y-%m')
       ORDER BY month ASC`,
      params,
    );

    return rows;
  }
}

module.exports = ReportDAO;
