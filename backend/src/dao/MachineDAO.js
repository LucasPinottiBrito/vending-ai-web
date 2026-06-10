const IDAO = require("../interfaces/IDAO");
const mysql = require("../config/mysql");

class MachineDAO extends IDAO {
  async create(data) {
    const [result] = await mysql.query(
      `INSERT INTO machines
        (name, slug, location, status, mqtt_base_topic, last_seen_at, firmware_version, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.slug,
        data.location || null,
        data.status || "OFFLINE",
        data.mqtt_base_topic || null,
        data.last_seen_at || null,
        data.firmware_version || null,
        data.is_active ?? 1,
      ],
    );

    return this.findById(result.insertId);
  }

  async createWithSlots(machineData, slots = []) {
    const connection = await mysql.getPool().getConnection();

    try {
      await connection.beginTransaction();

      const [machineResult] = await connection.query(
        `INSERT INTO machines
          (name, slug, location, status, mqtt_base_topic, last_seen_at, firmware_version, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          machineData.name,
          machineData.slug,
          machineData.location || null,
          machineData.status || "OFFLINE",
          machineData.mqtt_base_topic || null,
          machineData.last_seen_at || null,
          machineData.firmware_version || null,
          machineData.is_active ?? 1,
        ],
      );

      const machineId = machineResult.insertId;
      for (const slot of slots) {
        await connection.query(
          `INSERT INTO slots (machine_id, code, motor_id, sensor_column_id, is_enabled)
           VALUES (?, ?, ?, ?, ?)`,
          [
            machineId,
            slot.code,
            slot.motor_id,
            slot.sensor_column_id,
            slot.is_enabled ?? 1,
          ],
        );
      }

      await connection.commit();
      return this.findById(machineId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findById(id) {
    const [rows] = await mysql.query(
      `SELECT id, name, slug, location, status, mqtt_base_topic, last_seen_at,
              firmware_version, is_active, created_at, updated_at
       FROM machines
       WHERE id = ?`,
      [id],
    );

    return rows[0] || null;
  }

  async findBySlug(slug) {
    const [rows] = await mysql.query(
      `SELECT id, name, slug, location, status, mqtt_base_topic, last_seen_at,
              firmware_version, is_active, created_at, updated_at
       FROM machines
       WHERE slug = ?`,
      [slug],
    );

    return rows[0] || null;
  }

  async findAll(filters = {}) {
    const where = [];
    const params = [];

    if (filters.search) {
      where.push("(name LIKE ? OR slug LIKE ? OR location LIKE ?)");
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.status && filters.status !== "all") {
      where.push("status = ?");
      params.push(filters.status);
    }

    if (filters.active === "active") {
      where.push("is_active = 1");
    }

    if (filters.active === "inactive") {
      where.push("is_active = 0");
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await mysql.query(
      `SELECT id, name, slug, location, status, mqtt_base_topic, last_seen_at,
              firmware_version, is_active, created_at, updated_at
       FROM machines
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
      "name",
      "slug",
      "location",
      "status",
      "mqtt_base_topic",
      "last_seen_at",
      "firmware_version",
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
    await mysql.query(`UPDATE machines SET ${fields.join(", ")} WHERE id = ?`, params);
    return this.findById(id);
  }

  async updateWithConnection(id, data, connection) {
    const fields = [];
    const params = [];
    const allowedFields = [
      "name",
      "slug",
      "location",
      "status",
      "mqtt_base_topic",
      "last_seen_at",
      "firmware_version",
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
    await connection.query(`UPDATE machines SET ${fields.join(", ")} WHERE id = ?`, params);
    const [rows] = await connection.query(
      `SELECT id, name, slug, location, status, mqtt_base_topic, last_seen_at,
              firmware_version, is_active, created_at, updated_at
       FROM machines
       WHERE id = ?`,
      [id],
    );
    return rows[0] || null;
  }

  async markOfflineWithoutHeartbeat(thresholdDate, connection = mysql) {
    const [result] = await connection.query(
      `UPDATE machines
       SET status = 'OFFLINE'
       WHERE is_active = 1
         AND status = 'ONLINE'
         AND (last_seen_at IS NULL OR last_seen_at < ?)`,
      [thresholdDate],
    );

    return result.affectedRows;
  }

  async delete(id) {
    await mysql.query("UPDATE machines SET is_active = 0 WHERE id = ?", [id]);
    return this.findById(id);
  }
}

module.exports = MachineDAO;
