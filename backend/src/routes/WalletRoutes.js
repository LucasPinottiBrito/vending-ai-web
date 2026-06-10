const { Router } = require("express");

const WalletController = require("../controllers/WalletController");
const { authMiddleware } = require("../middlewares/auth_middleware");
const validate = require("../middlewares/validation_middleware");
const {
  mockTopupSchema,
  walletTransactionsQuerySchema,
} = require("../validators/walletValidator");

class WalletRoutes {
  constructor(walletController = new WalletController()) {
    this.router = Router();
    this.walletController = walletController;
    this.register();
  }

  register() {
    this.router.get(
      "/wallet/balance",
      authMiddleware,
      this.walletController.getBalance,
    );
    this.router.get(
      "/wallet/transactions",
      authMiddleware,
      validate({ query: walletTransactionsQuerySchema }),
      this.walletController.listTransactions,
    );
    this.router.post(
      "/wallet/topup/mock",
      authMiddleware,
      validate({ body: mockTopupSchema }),
      this.walletController.createMockTopup,
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = WalletRoutes;
