const Joi = require("joi");

const importExportEntityQuerySchema = Joi.object({
  entity: Joi.string().valid("products", "inventory").required(),
});

module.exports = {
  importExportEntityQuerySchema,
};
