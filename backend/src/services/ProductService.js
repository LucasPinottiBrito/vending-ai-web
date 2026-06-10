const IService = require("../interfaces/IService");
const ProductDAO = require("../dao/ProductDAO");
const LogService = require("./LogService");
const ApiError = require("../utils/ApiError");
const { normalizeProduct } = require("../models/ProductModel");

class ProductService extends IService {
  constructor(productDAO = new ProductDAO(), logService = new LogService()) {
    super();
    this.productDAO = productDAO;
    this.logService = logService;
  }

  async create(data, context = {}) {
    const existing = await this.productDAO.findBySku(data.sku);

    if (existing) {
      throw new ApiError(409, "Product SKU already exists", "PRODUCT_SKU_ALREADY_EXISTS");
    }

    const product = normalizeProduct(
      await this.productDAO.create({
        ...data,
        is_active: data.is_active === undefined ? 1 : Number(Boolean(data.is_active)),
      }),
    );

    await this.logCrud("CREATE", { context, recordId: product.id, after: product });

    return product;
  }

  async getById(id) {
    const product = normalizeProduct(await this.productDAO.findById(id));

    if (!product) {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }

    return product;
  }

  async list(filters = {}) {
    const products = await this.productDAO.findAll(filters);
    return products.map(normalizeProduct);
  }

  async update(id, data, context = {}) {
    const before = normalizeProduct(await this.productDAO.findById(id));

    if (!before) {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }

    if (data.sku && data.sku !== before.sku) {
      const existing = await this.productDAO.findBySku(data.sku);
      if (existing && existing.id !== Number(id)) {
        throw new ApiError(409, "Product SKU already exists", "PRODUCT_SKU_ALREADY_EXISTS");
      }
    }

    const updateData = { ...data };

    if (data.is_active !== undefined) {
      updateData.is_active = Number(Boolean(data.is_active));
    }

    const after = normalizeProduct(await this.productDAO.update(id, updateData));

    await this.logCrud("UPDATE", {
      context,
      recordId: after.id,
      before,
      after,
      details: { changed_fields: Object.keys(data) },
    });

    return after;
  }

  async delete(id, context = {}) {
    const before = normalizeProduct(await this.productDAO.findById(id));

    if (!before) {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }

    const after = normalizeProduct(await this.productDAO.delete(id));

    await this.logCrud("DELETE", {
      context,
      recordId: after.id,
      before,
      after,
    });

    return after;
  }

  async updateImage(id, file, context = {}) {
    if (!file) {
      throw new ApiError(400, "Product image is required", "PRODUCT_IMAGE_REQUIRED");
    }

    return this.update(
      id,
      {
        image_path: `/uploads/products/${file.filename}`,
      },
      context,
    );
  }

  async logCrud(eventType, { context, recordId, before = null, after = null, details = {} }) {
    await this.logService.create({
      event_type: eventType,
      action: `${context.method || null} ${context.endpoint || null}`,
      method: context.method || null,
      endpoint: context.endpoint || null,
      status_code: context.status_code || null,
      response_time_ms: context.response_time_ms || 0,
      ip: context.ip || null,
      user_agent: context.user_agent || null,
      user_id: context.user?.id || null,
      username: context.user?.email || null,
      table: "products",
      record_id: recordId,
      before,
      after,
      details,
    });
  }
}

module.exports = ProductService;
