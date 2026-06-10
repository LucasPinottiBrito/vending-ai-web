const IDAO = require("../interfaces/IDAO");
const mysql = require("../config/mysql");

class SlotDAO extends IDAO {
  async create(data) {
    const [result] = await mysql.query(
      `INSERT INTO slots (machine_id, code, motor_id, sensor_column_id, is_enabled)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.machine_id,
        data.code,
        data.motor_id,
        data.sensor_column_id,
        data.is_enabled ?? 1,
      ],
    );

    return this.findById(result.insertId);
  }

  async findById(id) {
    const [rows] = await mysql.query(
      `SELECT id, machine_id, code, motor_id, sensor_column_id, is_enabled, created_at, updated_at
       FROM slots
       WHERE id = ?`,
      [id],
    );

    return rows[0] || null;
  }

  async findAll(filters = {}) {
    if (filters.machine_id) {
      return this.findByMachineId(filters.machine_id);
    }

    const [rows] = await mysql.query(
      `SELECT id, machine_id, code, motor_id, sensor_column_id, is_enabled, created_at, updated_at
       FROM slots
       ORDER BY machine_id ASC, code ASC
       LIMIT ?`,
      [Number(filters.limit || 100)],
    );

    return rows;
  }

  async findByMachineId(machineId) {
    const [rows] = await mysql.query(
      `SELECT id, machine_id, code, motor_id, sensor_column_id, is_enabled, created_at, updated_at
       FROM slots
       WHERE machine_id = ?
       ORDER BY code ASC`,
      [machineId],
    );

    return rows;
  }

  async update(id, data) {
    const fields = [];
    const params = [];
    const allowedFields = ["code", "motor_id", "sensor_column_id", "is_enabled"];

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
    await mysql.query(`UPDATE slots SET ${fields.join(", ")} WHERE id = ?`, params);
    return this.findById(id);
  }

  async delete(id) {
    await mysql.query("UPDATE slots SET is_enabled = 0 WHERE id = ?", [id]);
    return this.findById(id);
  }
}

module.exports = SlotDAO;
