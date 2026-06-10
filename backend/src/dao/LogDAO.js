const IDAO = require("../interfaces/IDAO");
const { getMongoDb } = require("../config/mongodb");

class LogDAO extends IDAO {
  async collection() {
    const db = await getMongoDb();
    return db.collection("logs");
  }

  async create(data) {
    const logs = await this.collection();
    const result = await logs.insertOne(data);
    return { ...data, _id: result.insertedId };
  }

  async findById(id) {
    const logs = await this.collection();
    return logs.findOne({ _id: id });
  }

  async findAll(filters = {}) {
    const logs = await this.collection();
    const query = {};

    if (filters.event_type) query.event_type = filters.event_type;
    if (filters.user) {
      if (/^\d+$/.test(String(filters.user))) {
        query.user_id = Number(filters.user);
      } else {
        query.username = filters.user;
      }
    }
    if (filters.user_id) query.user_id = Number(filters.user_id);
    if (filters.endpoint) query.endpoint = filters.endpoint;
    if (filters.status_code) query.status_code = Number(filters.status_code);
    if (filters.start_date || filters.end_date) {
      query.timestamp = {};
      if (filters.start_date) query.timestamp.$gte = new Date(filters.start_date);
      if (filters.end_date) query.timestamp.$lte = new Date(filters.end_date);
    }

    return logs.find(query).sort({ timestamp: -1 }).limit(Number(filters.limit || 100)).toArray();
  }

  async update() {
    throw new Error("Logs are immutable and cannot be updated");
  }

  async delete() {
    throw new Error("Logs are immutable and cannot be deleted");
  }
}

module.exports = LogDAO;
