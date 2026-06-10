const Joi = require("joi");

const mockTopupSchema = Joi.object({
  amount_cents: Joi.number().integer().positive().max(1000000).required(),
});

const walletTransactionsQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(200).default(100),
});

module.exports = {
  mockTopupSchema,
  walletTransactionsQuerySchema,
};
