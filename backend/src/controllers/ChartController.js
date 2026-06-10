const IController = require("../interfaces/IController");
const ChartService = require("../services/ChartService");
const { sendSuccess } = require("../utils/response");
const ApiError = require("../utils/ApiError");

class ChartController extends IController {
  constructor(chartService = new ChartService()) {
    super();
    this.chartService = chartService;
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
    this.list = this.list.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.salesByMonth = this.salesByMonth.bind(this);
  }

  async create(req, res, next) {
    return next(new ApiError(501, "Chart create is not implemented", "NOT_IMPLEMENTED"));
  }

  async getById(req, res, next) {
    return next(new ApiError(501, "Chart getById is not implemented", "NOT_IMPLEMENTED"));
  }

  async list(req, res, next) {
    return this.salesByMonth(req, res, next);
  }

  async update(req, res, next) {
    return next(new ApiError(501, "Chart update is not implemented", "NOT_IMPLEMENTED"));
  }

  async delete(req, res, next) {
    return next(new ApiError(501, "Chart delete is not implemented", "NOT_IMPLEMENTED"));
  }

  async salesByMonth(req, res, next) {
    try {
      const chart = await this.chartService.getSalesByMonth(req.query, this.buildContext(req));
      return sendSuccess(res, { chart }, "Sales by month chart generated");
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

module.exports = ChartController;
