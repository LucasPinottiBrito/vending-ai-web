const { Router } = require("express");

const LogController = require("../controllers/LogController");
const { authMiddleware, requireRole } = require("../middlewares/auth_middleware");
const validate = require("../middlewares/validation_middleware");
const {
  logXmlExportQuerySchema,
  logListQuerySchema,
} = require("../validators/logValidator");

class LogRoutes {
  constructor(logController = new LogController()) {
    this.router = Router();
    this.logController = logController;
    this.register();
  }

  register() {
    this.router.get(
      "/admin/logs",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ query: logListQuerySchema }),
      this.logController.list,
    );

    this.router.get(
      "/admin/logs/export/xml",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ query: logXmlExportQuerySchema }),
      this.logController.exportXml,
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = LogRoutes;
