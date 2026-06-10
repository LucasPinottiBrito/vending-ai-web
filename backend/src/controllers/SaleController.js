const IController = require("../interfaces/IController");
const SaleService = require("../services/SaleService");
const { sendSuccess } = require("../utils/response");

class SaleController extends IController {
  constructor(saleService = new SaleService()) {
    super();
    this.saleService = saleService;
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
    this.list = this.list.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.checkout = this.checkout.bind(this);
    this.listPurchases = this.listPurchases.bind(this);
  }

  async create(req, res, next) {
    return this.checkout(req, res, next);
  }

  async getById(req, res, next) {
    try {
      const details = await this.saleService.getById(req.params.id, this.buildContext(req));
      return sendSuccess(res, details, "Sale found");
    } catch (error) {
      return next(error);
    }
  }

  async list(req, res, next) {
    try {
      const sales = await this.saleService.list(req.query, this.buildContext(req));
      return sendSuccess(res, { sales }, "Sales listed");
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const sale = await this.saleService.update(req.params.id, req.body, this.buildContext(req));
      return sendSuccess(res, { sale }, "Sale updated successfully");
    } catch (error) {
      return next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const sale = await this.saleService.delete(req.params.id, this.buildContext(req));
      return sendSuccess(res, { sale }, "Sale deleted successfully");
    } catch (error) {
      return next(error);
    }
  }

  async checkout(req, res, next) {
    try {
      const result = await this.saleService.checkout(req.body, this.buildContext(req, 201));
      const statusCode = result.idempotent ? 200 : 201;
      return sendSuccess(res, result, "Checkout completed successfully", statusCode);
    } catch (error) {
      return next(error);
    }
  }

  async listPurchases(req, res, next) {
    try {
      const purchases = await this.saleService.list(req.query, this.buildContext(req));
      return sendSuccess(res, { purchases }, "Purchases listed");
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
      idempotency_key: req.get("idempotency-key") || req.body?.idempotency_key || null,
    };
  }
}

module.exports = SaleController;
