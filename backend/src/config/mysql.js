const mysql = require("mysql2/promise");

const env = require("./env");

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: env.mysql.host,
      port: env.mysql.port,
      database: env.mysql.database,
      user: env.mysql.user,
      password: env.mysql.password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      namedPlaceholders: true,
    });
  }

  return pool;
}

async function query(sql, params = []) {
  return getPool().query(sql, params);
}

async function testConnection() {
  const [rows] = await query("SELECT 1 AS ok");
  return rows[0]?.ok === 1;
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getPool,
  query,
  testConnection,
  closePool,
};
