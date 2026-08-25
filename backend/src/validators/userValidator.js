const Joi = require("joi");

const userListQuerySchema = Joi.object({
  search: Joi.string().trim().max(120).allow("").optional(),
  role: Joi.string().valid("USER", "ADMIN", "OPERATOR", "all").default("all"),
  active: Joi.string().valid("active", "inactive", "all").default("all"),
  limit: Joi.number().integer().min(1).max(200).default(100),
});

module.exports = {
  userListQuerySchema,
};
