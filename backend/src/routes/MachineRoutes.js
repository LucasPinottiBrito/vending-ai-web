const { Router } = require("express");

const MachineController = require("../controllers/MachineController");
const { authMiddleware, requireRole } = require("../middlewares/auth_middleware");
const validate = require("../middlewares/validation_middleware");
const {
  createMachineSchema,
  updateMachineSchema,
  machineIdParamSchema,
  machineSlugParamSchema,
  machineListQuerySchema,
} = require("../validators/machineValidator");

class MachineRoutes {
  constructor(machineController = new MachineController()) {
    this.router = Router();
    this.machineController = machineController;
    this.register();
  }

  register() {
    this.router.get(
      "/machines",
      validate({ query: machineListQuerySchema }),
      this.machineController.list,
    );
    this.router.get(
      "/machines/slug/:slug/catalog",
      validate({ params: machineSlugParamSchema }),
      this.machineController.getCatalogBySlug,
    );
    this.router.get(
      "/machines/slug/:slug",
      validate({ params: machineSlugParamSchema }),
      this.machineController.getBySlug,
    );
    this.router.get(
      "/machines/:id",
      validate({ params: machineIdParamSchema }),
      this.machineController.getById,
    );
    this.router.post(
      "/machines",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ body: createMachineSchema }),
      this.machineController.create,
    );
    this.router.put(
      "/machines/:id",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ params: machineIdParamSchema, body: updateMachineSchema }),
      this.machineController.update,
    );
    this.router.delete(
      "/machines/:id",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ params: machineIdParamSchema }),
      this.machineController.delete,
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = MachineRoutes;
