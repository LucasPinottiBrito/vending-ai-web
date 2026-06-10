const IDAO = require("../interfaces/IDAO");
const mysql = require("../config/mysql");

class MachineEventDAO extends IDAO {
  async create(data, connection = mysql) {
    const [result] = await connection.query(
      `INSERT INTO machine_events
        (machine_id, sale_id, dispense_command_id, event_type, payload_json, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.machine_id,
        data.sale_id || null,
        data.dispense_command_id || null,
        data.event_type,
        data.payload_json ? JSON.stringify(data.payload_json) : null,
        data.occurred_at || new Date(),
      ],
    );

    return this.findById(result.insertId, connection);
  }

  async findById(id, connection = mysql) {
    const [rows] = await connection.query(
      `SELECT id, machine_id, sale_id, dispense_command_id, event_type,
              payload_json, occurred_at, created_at, updated_at
       FROM machine_events
       WHERE id = ?`,
      [id],
    );

    return rows[0] || null;
  }

  async findAll(filters = {}, connection = mysql) {
    const where = [];
    const params = [];

    if (filters.machine_id) {
      where.push("machine_id = ?");
      params.push(filters.machine_id);
    }

    if (filters.sale_id) {
      where.push("sale_id = ?");
      params.push(filters.sale_id);
    }

    if (filters.event_type) {
      where.push("event_type = ?");
      params.push(filters.event_type);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await connection.query(
      `SELECT id, machine_id, sale_id, dispense_command_id, event_type,
              payload_json, occurred_at, created_at, updated_at
       FROM machine_events
       ${whereSql}
       ORDER BY occurred_at DESC, id DESC
       LIMIT ?`,
      [...params, Number(filters.limit || 100)],
    );

    return rows;
  }

  async update() {
    throw new Error("Machine events are immutable");
  }

  async delete() {
    throw new Error("Machine events cannot be deleted");
  }
}

module.exports = MachineEventDAO;
