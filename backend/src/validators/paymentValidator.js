const Joi = require("joi");

const paymentIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

module.exports = {
  paymentIdParamSchema,
};
