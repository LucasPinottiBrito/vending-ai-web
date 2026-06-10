const crypto = require("node:crypto");

const IService = require("../interfaces/IService");
const WalletDAO = require("../dao/WalletDAO");
const WalletTransactionDAO = require("../dao/WalletTransactionDAO");
const PaymentDAO = require("../dao/PaymentDAO");
const LogService = require("./LogService");
const ApiError = require("../utils/ApiError");
const { normalizeWallet } = require("../models/WalletModel");
const { normalizeWalletTransaction } = require("../models/WalletTransactionModel");
const { normalizePayment } = require("../models/PaymentModel");

class WalletService extends IService {
  constructor(
    walletDAO = new WalletDAO(),
    walletTransactionDAO = new WalletTransactionDAO(),
    paymentDAO = new PaymentDAO(),
    logService = new LogService(),
  ) {
    super();
    this.walletDAO = walletDAO;
    this.walletTransactionDAO = walletTransactionDAO;
    this.paymentDAO = paymentDAO;
    this.logService = logService;
  }

  async create(data, context = {}) {
    return this.createMockTopup(data, context);
  }

  async getById(id) {
    const wallet = normalizeWallet(await this.walletDAO.findById(id));
    if (!wallet) {
      throw new ApiError(404, "Wallet not found", "WALLET_NOT_FOUND");
    }

    return wallet;
  }

  async list(filters = {}) {
    return (await this.walletTransactionDAO.findAll(filters)).map(normalizeWalletTransaction);
  }

  async update() {
    throw new ApiError(501, "Wallet update is not implemented", "NOT_IMPLEMENTED");
  }

  async delete() {
    throw new ApiError(501, "Wallet delete is not implemented", "NOT_IMPLEMENTED");
  }

  async getBalance(userId) {
    const wallet = normalizeWallet(await this.walletDAO.findByUserId(userId));
    if (!wallet) {
      throw new ApiError(404, "Wallet not found", "WALLET_NOT_FOUND");
    }

    return wallet;
  }

  async listTransactions(userId, filters = {}) {
    const wallet = await this.getBalance(userId);
    const transactions = await this.walletTransactionDAO.findAll({
      ...filters,
      wallet_id: wallet.id,
      user_id: userId,
    });

    return transactions.map(normalizeWalletTransaction);
  }

  async createMockTopup(data, context = {}) {
    const userId = context.user?.id;
    if (!userId) {
      throw new ApiError(401, "Authentication is required", "AUTH_REQUIRED");
    }

    const wallet = normalizeWallet(await this.walletDAO.findByUserId(userId));
    if (!wallet) {
      throw new ApiError(404, "Wallet not found", "WALLET_NOT_FOUND");
    }

    const providerPaymentId = `mock-${userId}-${crypto.randomUUID()}`;
    const payment = normalizePayment(
      await this.paymentDAO.create({
        user_id: userId,
        type: "MOCK_TOPUP",
        provider: "MOCK",
        provider_payment_id: providerPaymentId,
        amount_cents: data.amount_cents,
        status: "PENDING",
        mock_qr_code: `mock://topup/${providerPaymentId}`,
        mock_copy_paste: providerPaymentId,
        expires_at: new Date(Date.now() + 15 * 60 * 1000),
      }),
    );

    await this.logCrud("CREATE", {
      context,
      table: "payments",
      recordId: payment.id,
      after: payment,
    });

    return payment;
  }

  async logCrud(eventType, { context, table, recordId, before = null, after = null, details = {} }) {
    await this.logService.create({
      event_type: eventType,
      action: `${context.method || null} ${context.endpoint || null}`,
      method: context.method || null,
      endpoint: context.endpoint || null,
      status_code: context.status_code || null,
      response_time_ms: context.response_time_ms || 0,
      ip: context.ip || null,
      user_agent: context.user_agent || null,
      user_id: context.user?.id || null,
      username: context.user?.email || null,
      table,
      record_id: recordId,
      before,
      after,
      details,
    });
  }
}

module.exports = WalletService;
