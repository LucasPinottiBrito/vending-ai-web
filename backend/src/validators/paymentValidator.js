const Joi = require("joi");

const paymentIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const paymentListQuerySchema = Joi.object({
  search: Joi.string().trim().max(160).allow("").optional(),
  status: Joi.string().valid("PENDING", "PAID", "EXPIRED", "FAILED", "CANCELED", "all").default("all"),
  type: Joi.string().valid("MOCK_TOPUP", "all").default("all"),
  user_id: Joi.number().integer().positive().optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional(),
  limit: Joi.number().integer().min(1).max(200).default(100),
});

module.exports = {
  paymentIdParamSchema,
  paymentListQuerySchema,
};
