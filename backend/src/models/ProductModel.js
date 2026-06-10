const env = require("../config/env");

function normalizeProduct(product) {
  if (!product) {
    return null;
  }

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    category: product.category,
    price_cents: product.price_cents,
    image_path: product.image_path,
    image_url: product.image_path
      ? `${env.publicUploadBaseUrl.replace(/\/$/, "")}/${product.image_path.split("/").pop()}`
      : null,
    is_active: Boolean(product.is_active),
    created_at: product.created_at,
    updated_at: product.updated_at,
  };
}

module.exports = {
  normalizeProduct,
};
