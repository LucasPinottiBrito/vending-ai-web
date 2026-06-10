const { Router } = require("express");

const PaymentController = require("../controllers/PaymentController");
const { authMiddleware } = require("../middlewares/auth_middleware");
const validate = require("../middlewares/validation_middleware");
const { paymentIdParamSchema } = require("../validators/paymentValidator");

class PaymentRoutes {
  constructor(paymentController = new PaymentController()) {
    this.router = Router();
    this.paymentController = paymentController;
    this.register();
  }

  register() {
    this.router.get(
      "/payments/:id",
      authMiddleware,
      validate({ params: paymentIdParamSchema }),
      this.paymentController.getById,
    );
    this.router.post(
      "/payments/:id/confirm-mock",
      authMiddleware,
      validate({ params: paymentIdParamSchema }),
      this.paymentController.confirmMock,
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = PaymentRoutes;
