const { Router } = require("express");

const ChartController = require("../controllers/ChartController");
const { authMiddleware, requireRole } = require("../middlewares/auth_middleware");
const validate = require("../middlewares/validation_middleware");
const { salesByMonthQuerySchema } = require("../validators/chartValidator");

class ChartRoutes {
  constructor(chartController = new ChartController()) {
    this.router = Router();
    this.chartController = chartController;
    this.register();
  }

  register() {
    this.router.get(
      "/admin/charts/sales-by-month",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ query: salesByMonthQuerySchema }),
      this.chartController.salesByMonth,
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = ChartRoutes;
