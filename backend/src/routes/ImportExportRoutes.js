const { Router } = require("express");

const ImportExportController = require("../controllers/ImportExportController");
const { authMiddleware, requireRole } = require("../middlewares/auth_middleware");
const validate = require("../middlewares/validation_middleware");
const { jsonFileUpload } = require("../utils/fileUpload");
const { importExportEntityQuerySchema } = require("../validators/importExportValidator");

class ImportExportRoutes {
  constructor(importExportController = new ImportExportController()) {
    this.router = Router();
    this.importExportController = importExportController;
    this.register();
  }

  register() {
    this.router.get(
      "/admin/export/json",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ query: importExportEntityQuerySchema }),
      this.importExportController.exportJson,
    );

    this.router.post(
      "/admin/import/json",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ query: importExportEntityQuerySchema }),
      jsonFileUpload.single("file"),
      this.importExportController.importJson,
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = ImportExportRoutes;
