const Joi = require("joi");

const inventoryIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const inventoryMachineIdParamSchema = Joi.object({
  machineId: Joi.number().integer().positive().required(),
});

const createInventorySchema = Joi.object({
  machine_id: Joi.number().integer().positive().required(),
  slot_id: Joi.number().integer().positive().required(),
  product_id: Joi.number().integer().positive().required(),
  quantity_available: Joi.number().integer().min(0).default(0),
  quantity_reserved: Joi.number().integer().min(0).default(0),
  min_quantity_alert: Joi.number().integer().min(0).default(0),
});

const updateInventorySchema = Joi.object({
  machine_id: Joi.number().integer().positive().optional(),
  slot_id: Joi.number().integer().positive().optional(),
  product_id: Joi.number().integer().positive().optional(),
  quantity_available: Joi.number().integer().min(0).optional(),
  quantity_reserved: Joi.number().integer().min(0).optional(),
  min_quantity_alert: Joi.number().integer().min(0).optional(),
}).min(1);

const adjustInventorySchema = Joi.object({
  quantity_available_delta: Joi.number().integer().optional(),
  quantity_reserved_delta: Joi.number().integer().optional(),
  reason: Joi.string().trim().allow(null, "").max(255).optional(),
}).or("quantity_available_delta", "quantity_reserved_delta");

const inventoryListQuerySchema = Joi.object({
  machine_id: Joi.number().integer().positive().optional(),
  product_id: Joi.number().integer().positive().optional(),
  low_stock: Joi.string().valid("true", "false").optional(),
  limit: Joi.number().integer().min(1).max(500).default(100),
});

module.exports = {
  inventoryIdParamSchema,
  inventoryMachineIdParamSchema,
  createInventorySchema,
  updateInventorySchema,
  adjustInventorySchema,
  inventoryListQuerySchema,
};
