const IController = require("../interfaces/IController");
const ImportExportService = require("../services/ImportExportService");
const { sendSuccess } = require("../utils/response");
const ApiError = require("../utils/ApiError");

class ImportExportController extends IController {
  constructor(importExportService = new ImportExportService()) {
    super();
    this.importExportService = importExportService;
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
    this.list = this.list.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.exportJson = this.exportJson.bind(this);
    this.importJson = this.importJson.bind(this);
  }

  async create(req, res, next) {
    return this.importJson(req, res, next);
  }

  async getById(req, res, next) {
    return next(new ApiError(501, "Import/export getById is not implemented", "NOT_IMPLEMENTED"));
  }

  async list(req, res, next) {
    return this.exportJson(req, res, next);
  }

  async update(req, res, next) {
    return next(new ApiError(501, "Import/export update is not implemented", "NOT_IMPLEMENTED"));
  }

  async delete(req, res, next) {
    return next(new ApiError(501, "Import/export delete is not implemented", "NOT_IMPLEMENTED"));
  }

  async exportJson(req, res, next) {
    try {
      const exported = await this.importExportService.exportEntity(
        req.query.entity,
        this.buildContext(req),
      );

      res.setHeader("Content-Disposition", `attachment; filename="${req.query.entity}-export.json"`);
      return sendSuccess(res, { export: exported }, "JSON exported successfully");
    } catch (error) {
      return next(error);
    }
  }

  async importJson(req, res, next) {
    try {
      const result = await this.importExportService.importEntity(
        req.query.entity,
        req.file,
        this.buildContext(req, 201),
      );

      return sendSuccess(res, result, "JSON imported successfully", 201);
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

module.exports = ImportExportController;
