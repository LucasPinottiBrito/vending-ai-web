const Joi = require("joi");

const machineIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const machineSlugParamSchema = Joi.object({
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).max(120).required(),
});

const machineStatusSchema = Joi.string().valid("ONLINE", "OFFLINE", "MAINTENANCE", "ERROR");

const embeddedSlotSchema = Joi.object({
  code: Joi.string().trim().uppercase().max(20).required(),
  motor_id: Joi.number().integer().positive().required(),
  sensor_column_id: Joi.number().integer().positive().required(),
  is_enabled: Joi.boolean().optional(),
});

const createMachineSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).max(120).required(),
  location: Joi.string().trim().allow(null, "").max(255).optional(),
  status: machineStatusSchema.default("OFFLINE"),
  mqtt_base_topic: Joi.string().trim().allow(null, "").max(255).optional(),
  last_seen_at: Joi.date().iso().allow(null).optional(),
  firmware_version: Joi.string().trim().allow(null, "").max(50).optional(),
  is_active: Joi.boolean().optional(),
  slots: Joi.array().items(embeddedSlotSchema).max(100).optional(),
});

const updateMachineSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).optional(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).max(120).optional(),
  location: Joi.string().trim().allow(null, "").max(255).optional(),
  status: machineStatusSchema.optional(),
  mqtt_base_topic: Joi.string().trim().allow(null, "").max(255).optional(),
  last_seen_at: Joi.date().iso().allow(null).optional(),
  firmware_version: Joi.string().trim().allow(null, "").max(50).optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

const machineListQuerySchema = Joi.object({
  search: Joi.string().trim().max(120).optional(),
  status: Joi.string().valid("ONLINE", "OFFLINE", "MAINTENANCE", "ERROR", "all").default("all"),
  active: Joi.string().valid("active", "inactive", "all").default("all"),
  limit: Joi.number().integer().min(1).max(200).default(100),
});

module.exports = {
  createMachineSchema,
  updateMachineSchema,
  machineIdParamSchema,
  machineSlugParamSchema,
  machineListQuerySchema,
};
