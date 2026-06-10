const Joi = require("joi");

const machineIdParamSchema = Joi.object({
  machineId: Joi.number().integer().positive().required(),
});

const slotIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const createSlotSchema = Joi.object({
  code: Joi.string().trim().uppercase().max(20).required(),
  motor_id: Joi.number().integer().positive().required(),
  sensor_column_id: Joi.number().integer().positive().required(),
  is_enabled: Joi.boolean().optional(),
});

const updateSlotSchema = Joi.object({
  code: Joi.string().trim().uppercase().max(20).optional(),
  motor_id: Joi.number().integer().positive().optional(),
  sensor_column_id: Joi.number().integer().positive().optional(),
  is_enabled: Joi.boolean().optional(),
}).min(1);

module.exports = {
  machineIdParamSchema,
  slotIdParamSchema,
  createSlotSchema,
  updateSlotSchema,
};
