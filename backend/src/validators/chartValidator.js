const Joi = require("joi");

const salesByMonthQuerySchema = Joi.object({
  year: Joi.number().integer().min(2000).max(2100).optional(),
});

module.exports = {
  salesByMonthQuerySchema,
};
