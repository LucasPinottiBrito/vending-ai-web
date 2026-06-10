const IController = require("../interfaces/IController");
const WalletService = require("../services/WalletService");
const { sendSuccess } = require("../utils/response");

class WalletController extends IController {
  constructor(walletService = new WalletService()) {
    super();
    this.walletService = walletService;
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
    this.list = this.list.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.getBalance = this.getBalance.bind(this);
    this.listTransactions = this.listTransactions.bind(this);
    this.createMockTopup = this.createMockTopup.bind(this);
  }

  async create(req, res, next) {
    return this.createMockTopup(req, res, next);
  }

  async getById(req, res, next) {
    try {
      const wallet = await this.walletService.getById(req.params.id, this.buildContext(req));
      return sendSuccess(res, { wallet }, "Wallet found");
    } catch (error) {
      return next(error);
    }
  }

  async list(req, res, next) {
    return this.listTransactions(req, res, next);
  }

  async update(req, res, next) {
    try {
      const wallet = await this.walletService.update(req.params.id, req.body, this.buildContext(req));
      return sendSuccess(res, { wallet }, "Wallet updated successfully");
    } catch (error) {
      return next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const wallet = await this.walletService.delete(req.params.id, this.buildContext(req));
      return sendSuccess(res, { wallet }, "Wallet deleted successfully");
    } catch (error) {
      return next(error);
    }
  }

  async getBalance(req, res, next) {
    try {
      const wallet = await this.walletService.getBalance(req.user.id, this.buildContext(req));
      return sendSuccess(res, { wallet }, "Wallet balance found");
    } catch (error) {
      return next(error);
    }
  }

  async listTransactions(req, res, next) {
    try {
      const transactions = await this.walletService.listTransactions(
        req.user.id,
        req.query,
        this.buildContext(req),
      );
      return sendSuccess(res, { transactions }, "Wallet transactions listed");
    } catch (error) {
      return next(error);
    }
  }

  async createMockTopup(req, res, next) {
    try {
      const payment = await this.walletService.createMockTopup(req.body, this.buildContext(req, 201));
      return sendSuccess(res, { payment }, "Mock top-up created successfully", 201);
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

module.exports = WalletController;
