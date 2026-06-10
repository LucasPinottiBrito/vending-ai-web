const Joi = require("joi");

const saleIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const checkoutSchema = Joi.object({
  machine_id: Joi.number().integer().positive().required(),
  slot_id: Joi.number().integer().positive().required(),
  product_id: Joi.number().integer().positive().required(),
  idempotency_key: Joi.string().trim().max(120).optional(),
});

const saleListQuerySchema = Joi.object({
  status: Joi.string()
    .valid("CREATED", "AUTHORIZED", "DISPENSING", "DISPENSED", "FAILED", "REFUNDED")
    .optional(),
  user_id: Joi.number().integer().positive().optional(),
  limit: Joi.number().integer().min(1).max(200).default(100),
});

module.exports = {
  saleIdParamSchema,
  checkoutSchema,
  saleListQuerySchema,
};
