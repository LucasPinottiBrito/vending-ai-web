const IService = require("../interfaces/IService");
const LogDAO = require("../dao/LogDAO");
const { normalizeLogDocument } = require("../models/LogModel");
const { buildXml } = require("../utils/xml");

class LogService extends IService {
  constructor(logDAO = new LogDAO()) {
    super();
    this.logDAO = logDAO;
  }

  async create(data) {
    const document = normalizeLogDocument(data);
    return this.logDAO.create(document);
  }

  async getById(id) {
    return this.logDAO.findById(id);
  }

  async list(filters = {}) {
    return this.logDAO.findAll(filters);
  }

  async exportXml(filters = {}, context = {}) {
    const logs = await this.list({
      ...filters,
      limit: filters.limit || 1000,
    });

    const xml = buildXml("logs_export", {
      generated_at: new Date().toISOString(),
      filters: this.normalizeFilters(filters),
      total: logs.length,
      logs: {
        log: logs.map((log) => this.toXmlLog(log)),
      },
    });

    await this.create({
      event_type: "EXPORT_XML",
      action: `${context.method || null} ${context.endpoint || null}`,
      method: context.method || null,
      endpoint: context.endpoint || null,
      status_code: context.status_code || null,
      response_time_ms: context.response_time_ms || 0,
      ip: context.ip || null,
      user_agent: context.user_agent || null,
      user_id: context.user?.id || null,
      username: context.user?.email || null,
      table: "logs",
      details: {
        filters: this.normalizeFilters(filters),
        count: logs.length,
      },
    });

    return xml;
  }

  normalizeFilters(filters = {}) {
    return {
      user: filters.user || null,
      start_date: filters.start_date ? new Date(filters.start_date).toISOString() : null,
      end_date: filters.end_date ? new Date(filters.end_date).toISOString() : null,
      event_type: filters.event_type || null,
    };
  }

  toXmlLog(log) {
    const details = this.cleanXmlValue(log.details || {});
    const description =
      details.description ||
      log.error?.message ||
      log.action ||
      log.endpoint ||
      log.event_type;

    return {
      id: log._id ? String(log._id) : "",
      user: log.username || "",
      user_id: log.user_id === null || log.user_id === undefined ? "" : String(log.user_id),
      action: log.action || "",
      description,
      datetime: log.timestamp ? new Date(log.timestamp).toISOString() : "",
      event_type: log.event_type || "",
      ip: log.ip || "",
      method: log.method || "",
      endpoint: log.endpoint || "",
      status_code:
        log.status_code === null || log.status_code === undefined ? "" : String(log.status_code),
      response_time_ms:
        log.response_time_ms === null || log.response_time_ms === undefined
          ? ""
          : String(log.response_time_ms),
      linked_data: {
        table: log.table || "",
        record_id:
          log.record_id === null || log.record_id === undefined ? "" : String(log.record_id),
        before: this.cleanXmlValue(log.before || {}),
        after: this.cleanXmlValue(log.after || {}),
        details,
        error: this.cleanXmlValue(log.error || {}),
      },
    };
  }

  cleanXmlValue(value) {
    if (value === null || value === undefined) {
      return "";
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return {
        item: value.map((item) => this.cleanXmlValue(item)),
      };
    }

    if (typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [key, this.cleanXmlValue(entry)]),
      );
    }

    return String(value);
  }

  async update() {
    throw new Error("LogService.update is not supported");
  }

  async delete() {
    throw new Error("LogService.delete is not supported");
  }
}

module.exports = LogService;
