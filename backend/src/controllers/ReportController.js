const IController = require("../interfaces/IController");
const ReportService = require("../services/ReportService");
const { sendSuccess } = require("../utils/response");
const ApiError = require("../utils/ApiError");

class ReportController extends IController {
  constructor(reportService = new ReportService()) {
    super();
    this.reportService = reportService;
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
    this.list = this.list.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.sales = this.sales.bind(this);
    this.purchaseHistory = this.purchaseHistory.bind(this);
  }

  async create(req, res, next) {
    return this.sales(req, res, next);
  }

  async getById(req, res, next) {
    return next(new ApiError(501, "Report getById is not implemented", "NOT_IMPLEMENTED"));
  }

  async list(req, res, next) {
    return this.sales(req, res, next);
  }

  async update(req, res, next) {
    return next(new ApiError(501, "Report update is not implemented", "NOT_IMPLEMENTED"));
  }

  async delete(req, res, next) {
    return next(new ApiError(501, "Report delete is not implemented", "NOT_IMPLEMENTED"));
  }

  async sales(req, res, next) {
    try {
      const report = await this.reportService.generateSalesReport(req.query, this.buildContext(req));
      return sendSuccess(res, { report }, "Sales report generated");
    } catch (error) {
      return next(error);
    }
  }

  async purchaseHistory(req, res, next) {
    try {
      const report = await this.reportService.generatePurchaseHistory(
        req.query,
        this.buildContext(req),
      );
      return sendSuccess(res, { report }, "Purchase history report generated");
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

module.exports = ReportController;
