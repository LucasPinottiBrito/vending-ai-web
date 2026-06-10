const Joi = require("joi");
const { ALLOWED_LOG_EVENTS } = require("../models/LogModel");

const logXmlExportQuerySchema = Joi.object({
  user: Joi.string().trim().allow("").optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().min(Joi.ref("start_date")).optional(),
  event_type: Joi.string()
    .valid(...Array.from(ALLOWED_LOG_EVENTS))
    .optional(),
});

const logListQuerySchema = Joi.object({
  user: Joi.string().trim().allow("").optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().min(Joi.ref("start_date")).optional(),
  event_type: Joi.string()
    .valid(...Array.from(ALLOWED_LOG_EVENTS))
    .optional(),
  limit: Joi.number().integer().min(1).max(500).default(100),
});

module.exports = {
  logXmlExportQuerySchema,
  logListQuerySchema,
};
