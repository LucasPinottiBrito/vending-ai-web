const { Router } = require("express");

const SaleController = require("../controllers/SaleController");
const { authMiddleware } = require("../middlewares/auth_middleware");
const validate = require("../middlewares/validation_middleware");
const {
  saleIdParamSchema,
  checkoutSchema,
  saleListQuerySchema,
} = require("../validators/saleValidator");

class SaleRoutes {
  constructor(saleController = new SaleController()) {
    this.router = Router();
    this.saleController = saleController;
    this.register();
  }

  register() {
    this.router.post(
      "/sales/checkout",
      authMiddleware,
      validate({ body: checkoutSchema }),
      this.saleController.checkout,
    );
    this.router.get(
      "/sales",
      authMiddleware,
      validate({ query: saleListQuerySchema }),
      this.saleController.list,
    );
    this.router.get(
      "/sales/:id",
      authMiddleware,
      validate({ params: saleIdParamSchema }),
      this.saleController.getById,
    );
    this.router.get(
      "/users/me/purchases",
      authMiddleware,
      validate({ query: saleListQuerySchema }),
      this.saleController.listPurchases,
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = SaleRoutes;
