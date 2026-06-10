const IController = require("../interfaces/IController");
const PaymentService = require("../services/PaymentService");
const { sendSuccess } = require("../utils/response");

class PaymentController extends IController {
  constructor(paymentService = new PaymentService()) {
    super();
    this.paymentService = paymentService;
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
    this.list = this.list.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.confirmMock = this.confirmMock.bind(this);
  }

  async create(req, res, next) {
    try {
      const payment = await this.paymentService.create(req.body, this.buildContext(req, 201));
      return sendSuccess(res, { payment }, "Payment created successfully", 201);
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const payment = await this.paymentService.getById(req.params.id, this.buildContext(req));
      return sendSuccess(res, { payment }, "Payment found");
    } catch (error) {
      return next(error);
    }
  }

  async list(req, res, next) {
    try {
      const payments = await this.paymentService.list(req.query, this.buildContext(req));
      return sendSuccess(res, { payments }, "Payments listed");
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const payment = await this.paymentService.update(req.params.id, req.body, this.buildContext(req));
      return sendSuccess(res, { payment }, "Payment updated successfully");
    } catch (error) {
      return next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const payment = await this.paymentService.delete(req.params.id, this.buildContext(req));
      return sendSuccess(res, { payment }, "Payment deleted successfully");
    } catch (error) {
      return next(error);
    }
  }

  async confirmMock(req, res, next) {
    try {
      const result = await this.paymentService.confirmMockPayment(req.params.id, this.buildContext(req));
      return sendSuccess(res, result, "Mock payment confirmed successfully");
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

module.exports = PaymentController;
