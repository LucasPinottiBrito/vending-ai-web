const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().trim().lowercase().email().max(180).required(),
  password: Joi.string().min(8).max(72).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(180).required(),
  password: Joi.string().min(1).max(72).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
};
