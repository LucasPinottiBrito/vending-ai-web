const { Router } = require("express");

const InventoryController = require("../controllers/InventoryController");
const { authMiddleware, requireRole } = require("../middlewares/auth_middleware");
const validate = require("../middlewares/validation_middleware");
const {
  inventoryIdParamSchema,
  inventoryMachineIdParamSchema,
  createInventorySchema,
  updateInventorySchema,
  adjustInventorySchema,
  inventoryListQuerySchema,
} = require("../validators/inventoryValidator");

class InventoryRoutes {
  constructor(inventoryController = new InventoryController()) {
    this.router = Router();
    this.inventoryController = inventoryController;
    this.register();
  }

  register() {
    this.router.get(
      "/inventory",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ query: inventoryListQuerySchema }),
      this.inventoryController.list,
    );
    this.router.get(
      "/machines/:machineId/inventory",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ params: inventoryMachineIdParamSchema, query: inventoryListQuerySchema }),
      this.inventoryController.listByMachine,
    );
    this.router.get(
      "/inventory/:id",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ params: inventoryIdParamSchema }),
      this.inventoryController.getById,
    );
    this.router.post(
      "/inventory",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ body: createInventorySchema }),
      this.inventoryController.create,
    );
    this.router.put(
      "/inventory/:id",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ params: inventoryIdParamSchema, body: updateInventorySchema }),
      this.inventoryController.update,
    );
    this.router.post(
      "/inventory/:id/adjust",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ params: inventoryIdParamSchema, body: adjustInventorySchema }),
      this.inventoryController.adjust,
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = InventoryRoutes;
