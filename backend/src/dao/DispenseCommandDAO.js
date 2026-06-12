const IDAO = require("../interfaces/IDAO");
const mysql = require("../config/mysql");

class DispenseCommandDAO extends IDAO {
  async create(data, connection = mysql) {
    const [result] = await connection.query(
      `INSERT INTO dispense_commands
        (command_uuid, sale_id, machine_id, product_id, slot_id, motor_id, sensor_column_id,
         status, mqtt_topic, payload_json, attempts_allowed, attempts_reported, last_error,
         published_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.command_uuid || null,
        data.sale_id,
        data.machine_id,
        data.product_id,
        data.slot_id,
        data.motor_id,
        data.sensor_column_id,
        data.status,
        data.mqtt_topic || null,
        data.payload_json ? JSON.stringify(data.payload_json) : null,
        data.attempts_allowed || 2,
        data.attempts_reported || 0,
        data.last_error || null,
        data.published_at || null,
        data.completed_at || null,
      ],
    );

    return this.findById(result.insertId, connection);
  }

  async findById(id, connection = mysql) {
    const [rows] = await connection.query(
      `SELECT id, command_uuid, sale_id, machine_id, product_id, slot_id, motor_id,
              sensor_column_id, status, mqtt_topic, payload_json, attempts_allowed,
              attempts_reported, last_error, published_at, completed_at, created_at, updated_at
       FROM dispense_commands
       WHERE id = ?`,
      [id],
    );

    return rows[0] || null;
  }

  async findByIdForUpdate(id, connection = mysql) {
    const [rows] = await connection.query(
      `SELECT id, command_uuid, sale_id, machine_id, product_id, slot_id, motor_id,
              sensor_column_id, status, mqtt_topic, payload_json, attempts_allowed,
              attempts_reported, last_error, published_at, completed_at, created_at, updated_at
       FROM dispense_commands
       WHERE id = ?
       FOR UPDATE`,
      [id],
    );

    return rows[0] || null;
  }

  async findBySaleId(saleId, connection = mysql) {
    const [rows] = await connection.query(
      `SELECT id, command_uuid, sale_id, machine_id, product_id, slot_id, motor_id,
              sensor_column_id, status, mqtt_topic, payload_json, attempts_allowed,
              attempts_reported, last_error, published_at, completed_at, created_at, updated_at
       FROM dispense_commands
       WHERE sale_id = ?
       ORDER BY id ASC`,
      [saleId],
    );

    return rows;
  }

  async findFirstBySaleIdForUpdate(saleId, connection = mysql) {
    const [rows] = await connection.query(
      `SELECT id, command_uuid, sale_id, machine_id, product_id, slot_id, motor_id,
              sensor_column_id, status, mqtt_topic, payload_json, attempts_allowed,
              attempts_reported, last_error, published_at, completed_at, created_at, updated_at
       FROM dispense_commands
       WHERE sale_id = ?
       ORDER BY id ASC
       LIMIT 1
       FOR UPDATE`,
      [saleId],
    );

    return rows[0] || null;
  }

  async findByCommandUuid(commandUuid, connection = mysql) {
    const [rows] = await connection.query(
      `SELECT id, command_uuid, sale_id, machine_id, product_id, slot_id, motor_id,
              sensor_column_id, status, mqtt_topic, payload_json, attempts_allowed,
              attempts_reported, last_error, published_at, completed_at, created_at, updated_at
       FROM dispense_commands
       WHERE command_uuid = ?`,
      [commandUuid],
    );

    return rows[0] || null;
  }

  async findAll(filters = {}, connection = mysql) {
    if (filters.sale_id) {
      return this.findBySaleId(filters.sale_id, connection);
    }

    const [rows] = await connection.query(
      `SELECT id, command_uuid, sale_id, machine_id, product_id, slot_id, motor_id,
              sensor_column_id, status, mqtt_topic, payload_json, attempts_allowed,
              attempts_reported, last_error, published_at, completed_at, created_at, updated_at
       FROM dispense_commands
       ORDER BY id DESC
       LIMIT ?`,
      [Number(filters.limit || 100)],
    );

    return rows;
  }

  async update(id, data, connection = mysql) {
    const fields = [];
    const params = [];
    const allowedFields = [
      "status",
      "attempts_reported",
      "last_error",
      "published_at",
      "completed_at",
    ];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(data, field)) {
        fields.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (!fields.length) {
      return this.findById(id, connection);
    }

    params.push(id);
    await connection.query(`UPDATE dispense_commands SET ${fields.join(", ")} WHERE id = ?`, params);
    return this.findById(id, connection);
  }

  async delete() {
    throw new Error("Dispense commands cannot be deleted");
  }
}

module.exports = DispenseCommandDAO;
