const { Router } = require("express");
const DashboardController = require("../controllers/DashboardController");
const { authMiddleware, requireRole } = require("../middlewares/auth_middleware");

class DashboardRoutes {
  constructor(dashboardController = new DashboardController()) {
    this.router = Router();
    this.dashboardController = dashboardController;
    this.register();
  }

  register() {
    this.router.get(
      "/admin/dashboard/summary",
      authMiddleware,
      requireRole("ADMIN"),
      this.dashboardController.getSummary
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = DashboardRoutes;
