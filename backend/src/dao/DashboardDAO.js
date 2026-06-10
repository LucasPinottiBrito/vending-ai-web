const IDAO = require("../interfaces/IDAO");
const mysql = require("../config/mysql");

class DashboardDAO extends IDAO {
  async create() { throw new Error("Method not implemented."); }
  async findById() { throw new Error("Method not implemented."); }
  async findAll() { throw new Error("Method not implemented."); }
  async update() { throw new Error("Method not implemented."); }
  async delete() { throw new Error("Method not implemented."); }

  async getSummary() {
    const [sales] = await mysql.query(`
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(total_cents), 0) as total_revenue,
        SUM(CASE WHEN status = 'FAILED' OR status = 'REFUNDED' THEN 1 ELSE 0 END) as failure_count
      FROM sales
    `);

    const [products] = await mysql.query(`SELECT COUNT(*) as count FROM products WHERE is_active = 1`);
    const [machines] = await mysql.query(`SELECT COUNT(*) as count FROM machines WHERE is_active = 1`);
    const [lowStock] = await mysql.query(`
      SELECT COUNT(*) as count 
      FROM inventory 
      WHERE quantity_available - quantity_reserved <= min_quantity_alert
    `);

    const [recentFailures] = await mysql.query(`
      SELECT COUNT(*) as count 
      FROM sales 
      WHERE status IN ('FAILED', 'REFUNDED') 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    return {
      total_sales: Number(sales[0].total_sales),
      total_revenue_cents: Number(sales[0].total_revenue),
      product_count: Number(products[0].count),
      machine_count: Number(machines[0].count),
      low_stock_count: Number(lowStock[0].count),
      recent_failure_count: Number(recentFailures[0].count),
    };
  }
}

module.exports = DashboardDAO;
