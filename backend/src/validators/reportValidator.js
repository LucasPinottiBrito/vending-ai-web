const Joi = require("joi");

const saleStatusSchema = Joi.string().valid(
  "CREATED",
  "AUTHORIZED",
  "DISPENSING",
  "DISPENSED",
  "FAILED",
  "REFUNDED",
);

const salesReportQuerySchema = Joi.object({
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().min(Joi.ref("start_date")).optional(),
  machine_id: Joi.number().integer().positive().optional(),
  status: saleStatusSchema.optional(),
});

const purchaseHistoryReportQuerySchema = Joi.object({
  user_id: Joi.number().integer().positive().optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().min(Joi.ref("start_date")).optional(),
});

module.exports = {
  salesReportQuerySchema,
  purchaseHistoryReportQuerySchema,
};
