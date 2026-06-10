const Joi = require("joi");

const productIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const createProductSchema = Joi.object({
  sku: Joi.string().trim().uppercase().max(64).required(),
  name: Joi.string().trim().min(2).max(160).required(),
  description: Joi.string().trim().allow(null, "").max(1000).optional(),
  category: Joi.string().trim().allow(null, "").max(100).optional(),
  price_cents: Joi.number().integer().min(0).required(),
  image_path: Joi.string().trim().allow(null, "").max(255).optional(),
  is_active: Joi.boolean().optional(),
});

const updateProductSchema = Joi.object({
  sku: Joi.string().trim().uppercase().max(64).optional(),
  name: Joi.string().trim().min(2).max(160).optional(),
  description: Joi.string().trim().allow(null, "").max(1000).optional(),
  category: Joi.string().trim().allow(null, "").max(100).optional(),
  price_cents: Joi.number().integer().min(0).optional(),
  image_path: Joi.string().trim().allow(null, "").max(255).optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

const productListQuerySchema = Joi.object({
  search: Joi.string().trim().max(160).optional(),
  category: Joi.string().trim().max(100).optional(),
  status: Joi.string().valid("active", "inactive", "all").default("all"),
  limit: Joi.number().integer().min(1).max(200).default(100),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  productListQuerySchema,
};
