const { Router } = require("express");

const SlotController = require("../controllers/SlotController");
const { authMiddleware, requireRole } = require("../middlewares/auth_middleware");
const validate = require("../middlewares/validation_middleware");
const {
  machineIdParamSchema,
  slotIdParamSchema,
  createSlotSchema,
  updateSlotSchema,
} = require("../validators/slotValidator");

class SlotRoutes {
  constructor(slotController = new SlotController()) {
    this.router = Router();
    this.slotController = slotController;
    this.register();
  }

  register() {
    this.router.get(
      "/machines/:machineId/slots",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ params: machineIdParamSchema }),
      this.slotController.list,
    );
    this.router.post(
      "/machines/:machineId/slots",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ params: machineIdParamSchema, body: createSlotSchema }),
      this.slotController.create,
    );
    this.router.put(
      "/slots/:id",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ params: slotIdParamSchema, body: updateSlotSchema }),
      this.slotController.update,
    );
    this.router.delete(
      "/slots/:id",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ params: slotIdParamSchema }),
      this.slotController.delete,
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = SlotRoutes;
