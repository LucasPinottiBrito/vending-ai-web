const IController = require("../interfaces/IController");
const LogService = require("../services/LogService");
const ApiError = require("../utils/ApiError");

class LogController extends IController {
  constructor(logService = new LogService()) {
    super();
    this.logService = logService;
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
    this.list = this.list.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.exportXml = this.exportXml.bind(this);
  }

  async create(req, res, next) {
    return next(new ApiError(501, "Log create is not implemented for HTTP", "NOT_IMPLEMENTED"));
  }

  async getById(req, res, next) {
    try {
      const log = await this.logService.getById(req.params.id);
      if (!log) {
        return next(new ApiError(404, "Log not found", "NOT_FOUND"));
      }
      const { sendSuccess } = require("../utils/response");
      return sendSuccess(res, { log }, "Log found");
    } catch (error) {
      return next(error);
    }
  }

  async list(req, res, next) {
    try {
      const logs = await this.logService.list(req.query);
      const { sendSuccess } = require("../utils/response");
      return sendSuccess(res, { logs }, "Logs found");
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    return next(new ApiError(501, "Logs are immutable", "NOT_IMPLEMENTED"));
  }

  async delete(req, res, next) {
    return next(new ApiError(501, "Logs are immutable", "NOT_IMPLEMENTED"));
  }

  async exportXml(req, res, next) {
    try {
      const xml = await this.logService.exportXml(req.query, this.buildContext(req));

      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="logs-export.xml"');
      return res.status(200).send(xml);
    } catch (error) {
      return next(error);
    }
  }

  buildContext(req, statusCode = 200) {
    return {
      method: req.method,
      endpoint: req.originalUrl,
      ip: req.ip,
      user_agent: req.get("user-agent") || null,
      user: req.user || null,
      status_code: statusCode,
    };
  }
}

module.exports = LogController;
