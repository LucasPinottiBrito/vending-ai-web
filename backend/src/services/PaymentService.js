const IService = require("../interfaces/IService");
const mysql = require("../config/mysql");
const PaymentDAO = require("../dao/PaymentDAO");
const WalletDAO = require("../dao/WalletDAO");
const WalletTransactionDAO = require("../dao/WalletTransactionDAO");
const LogService = require("./LogService");
const ApiError = require("../utils/ApiError");
const { normalizePayment } = require("../models/PaymentModel");
const { normalizeWallet } = require("../models/WalletModel");
const { normalizeWalletTransaction } = require("../models/WalletTransactionModel");

class PaymentService extends IService {
  constructor(
    paymentDAO = new PaymentDAO(),
    walletDAO = new WalletDAO(),
    walletTransactionDAO = new WalletTransactionDAO(),
    logService = new LogService(),
  ) {
    super();
    this.paymentDAO = paymentDAO;
    this.walletDAO = walletDAO;
    this.walletTransactionDAO = walletTransactionDAO;
    this.logService = logService;
  }

  async create() {
    throw new ApiError(501, "Payment creation is handled by wallet top-up", "NOT_IMPLEMENTED");
  }

  async getById(id, context = {}) {
    const payment = normalizePayment(await this.paymentDAO.findById(id));
    if (!payment) {
      throw new ApiError(404, "Payment not found", "PAYMENT_NOT_FOUND");
    }

    this.assertCanAccessPayment(payment, context);
    return payment;
  }

  async list(filters = {}) {
    return (await this.paymentDAO.findAll(filters)).map(normalizePayment);
  }

  async update() {
    throw new ApiError(501, "Payment update is not implemented", "NOT_IMPLEMENTED");
  }

  async delete() {
    throw new ApiError(501, "Payment delete is not implemented", "NOT_IMPLEMENTED");
  }

  async confirmMockPayment(id, context = {}) {
    const connection = await mysql.getPool().getConnection();

    try {
      await connection.beginTransaction();

      const beforePayment = normalizePayment(
        await this.paymentDAO.findById(id, connection, { forUpdate: true }),
      );
      if (!beforePayment) {
        throw new ApiError(404, "Payment not found", "PAYMENT_NOT_FOUND");
      }

      this.assertCanAccessPayment(beforePayment, context);

      if (beforePayment.type !== "MOCK_TOPUP" || beforePayment.provider !== "MOCK") {
        throw new ApiError(400, "Only mock top-up payments can be confirmed", "PAYMENT_NOT_MOCK_TOPUP");
      }

      const walletBefore = normalizeWallet(
        await this.walletDAO.findByUserId(beforePayment.user_id, connection, { forUpdate: true }),
      );
      if (!walletBefore) {
        throw new ApiError(404, "Wallet not found", "WALLET_NOT_FOUND");
      }

      const existingTransactions = (
        await this.walletTransactionDAO.findByPaymentId(beforePayment.id, connection)
      ).map(normalizeWalletTransaction);

      if (beforePayment.status === "PAID") {
        const wallet = normalizeWallet(await this.walletDAO.findById(walletBefore.id, connection));
        await connection.commit();

        return {
          payment: beforePayment,
          wallet,
          transaction: existingTransactions[0] || null,
          idempotent: true,
        };
      }

      if (beforePayment.status !== "PENDING") {
        throw new ApiError(409, "Payment cannot be confirmed in its current status", "PAYMENT_NOT_PENDING");
      }

      const afterPayment = normalizePayment(
        await this.paymentDAO.update(
          beforePayment.id,
          {
            status: "PAID",
            paid_at: new Date(),
          },
          connection,
        ),
      );
      const walletAfter = normalizeWallet(
        await this.walletDAO.credit(walletBefore.id, beforePayment.amount_cents, connection),
      );
      const transaction = normalizeWalletTransaction(
        await this.walletTransactionDAO.create(
          {
            wallet_id: walletAfter.id,
            user_id: beforePayment.user_id,
            payment_id: beforePayment.id,
            type: "CREDIT",
            amount_cents: beforePayment.amount_cents,
            status: "COMPLETED",
            reference_type: "MOCK_TOPUP",
            reference_id: beforePayment.id,
            description: "Mock wallet top-up",
          },
          connection,
        ),
      );

      await connection.commit();

      await this.logCrud("UPDATE", {
        context,
        table: "payments",
        recordId: afterPayment.id,
        before: beforePayment,
        after: afterPayment,
      });
      await this.logCrud("UPDATE", {
        context,
        table: "wallets",
        recordId: walletAfter.id,
        before: walletBefore,
        after: walletAfter,
        details: { payment_id: afterPayment.id },
      });
      await this.logCrud("CREATE", {
        context,
        table: "wallet_transactions",
        recordId: transaction.id,
        after: transaction,
      });

      return {
        payment: afterPayment,
        wallet: walletAfter,
        transaction,
        idempotent: false,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  assertCanAccessPayment(payment, context = {}) {
    const user = context.user;
    if (!user) {
      throw new ApiError(401, "Authentication is required", "AUTH_REQUIRED");
    }

    if (user.role !== "ADMIN" && Number(payment.user_id) !== Number(user.id)) {
      throw new ApiError(403, "Payment access denied", "FORBIDDEN");
    }
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

module.exports = PaymentService;
