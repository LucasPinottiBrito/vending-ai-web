const { Router } = require("express");

const ReportController = require("../controllers/ReportController");
const { authMiddleware, requireRole } = require("../middlewares/auth_middleware");
const validate = require("../middlewares/validation_middleware");
const {
  salesReportQuerySchema,
  purchaseHistoryReportQuerySchema,
} = require("../validators/reportValidator");

class ReportRoutes {
  constructor(reportController = new ReportController()) {
    this.router = Router();
    this.reportController = reportController;
    this.register();
  }

  register() {
    this.router.get(
      "/admin/reports/sales",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ query: salesReportQuerySchema }),
      this.reportController.sales,
    );

    this.router.get(
      "/admin/reports/purchase-history",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ query: purchaseHistoryReportQuerySchema }),
      this.reportController.purchaseHistory,
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = ReportRoutes;
