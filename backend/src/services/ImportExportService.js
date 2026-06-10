const Joi = require("joi");

const IService = require("../interfaces/IService");
const ProductDAO = require("../dao/ProductDAO");
const InventoryDAO = require("../dao/InventoryDAO");
const ProductService = require("./ProductService");
const InventoryService = require("./InventoryService");
const LogService = require("./LogService");
const ApiError = require("../utils/ApiError");
const { normalizeProduct } = require("../models/ProductModel");
const { normalizeInventory } = require("../models/InventoryModel");

const productImportRecordSchema = Joi.object({
  sku: Joi.string().trim().uppercase().max(64).required(),
  name: Joi.string().trim().min(2).max(160).required(),
  description: Joi.string().trim().allow(null, "").max(1000).default(null),
  category: Joi.string().trim().allow(null, "").max(100).default(null),
  price_cents: Joi.number().integer().min(0).required(),
  image_path: Joi.string().trim().allow(null, "").max(255).default(null),
  is_active: Joi.boolean().default(true),
}).required();

const inventoryImportRecordSchema = Joi.object({
  machine_id: Joi.number().integer().positive().required(),
  slot_id: Joi.number().integer().positive().required(),
  product_id: Joi.number().integer().positive().required(),
  quantity_available: Joi.number().integer().min(0).required(),
  quantity_reserved: Joi.number().integer().min(0).required(),
  min_quantity_alert: Joi.number().integer().min(0).default(0),
}).required();

const importPayloadSchema = Joi.object({
  entity: Joi.string().valid("products", "inventory").required(),
  records: Joi.array().items(Joi.object()).min(1).max(1000).required(),
}).required();

class ImportExportService extends IService {
  constructor(
    productDAO = new ProductDAO(),
    inventoryDAO = new InventoryDAO(),
    productService = new ProductService(),
    inventoryService = new InventoryService(),
    logService = new LogService(),
  ) {
    super();
    this.productDAO = productDAO;
    this.inventoryDAO = inventoryDAO;
    this.productService = productService;
    this.inventoryService = inventoryService;
    this.logService = logService;
  }

  async create(data, context = {}) {
    return this.importEntity(data.entity, data.file, context);
  }

  async getById() {
    throw new ApiError(501, "Import/export getById is not implemented", "NOT_IMPLEMENTED");
  }

  async list(filters = {}, context = {}) {
    return this.exportEntity(filters.entity, context);
  }

  async update() {
    throw new ApiError(501, "Import/export update is not implemented", "NOT_IMPLEMENTED");
  }

  async delete() {
    throw new ApiError(501, "Import/export delete is not implemented", "NOT_IMPLEMENTED");
  }

  async exportEntity(entity, context = {}) {
    this.assertSupportedEntity(entity);

    const records =
      entity === "products"
        ? (await this.productDAO.findAll({ status: "all", limit: 10000 })).map(normalizeProduct)
        : (await this.inventoryDAO.findAll({ limit: 10000 })).map(normalizeInventory);

    const exported = {
      entity,
      exported_at: new Date().toISOString(),
      count: records.length,
      records,
    };

    await this.logJson("EXPORT_JSON", {
      context,
      entity,
      details: { entity, count: records.length },
    });

    return exported;
  }

  async importEntity(entity, file, context = {}) {
    this.assertSupportedEntity(entity);

    if (!file) {
      throw new ApiError(400, "JSON file is required", "JSON_FILE_REQUIRED");
    }

    const payload = this.parseJsonFile(file);
    const records = await this.validateImportPayload(entity, payload);

    const imported =
      entity === "products"
        ? await this.importProducts(records, context)
        : await this.importInventory(records, context);

    await this.logJson("IMPORT_JSON", {
      context,
      entity,
      details: {
        entity,
        count: imported.length,
        filename: file.originalname,
      },
    });

    return {
      entity,
      imported_count: imported.length,
      [entity]: imported,
    };
  }

  assertSupportedEntity(entity) {
    if (!["products", "inventory"].includes(entity)) {
      throw new ApiError(400, "Invalid import/export entity", "INVALID_IMPORT_EXPORT_ENTITY");
    }
  }

  parseJsonFile(file) {
    try {
      return JSON.parse(file.buffer.toString("utf8"));
    } catch (error) {
      throw new ApiError(400, "Invalid JSON file", "INVALID_JSON_FILE");
    }
  }

  async validateImportPayload(entity, payload) {
    const { error, value } = importPayloadSchema.validate(payload, {
      abortEarly: false,
      stripUnknown: false,
    });

    if (error) {
      throw new ApiError(400, "Invalid import structure", "INVALID_IMPORT_STRUCTURE", this.formatJoiErrors(error));
    }

    if (value.entity !== entity) {
      throw new ApiError(400, "Import file entity does not match query entity", "IMPORT_ENTITY_MISMATCH");
    }

    return entity === "products"
      ? this.validateProductRecords(value.records)
      : this.validateInventoryRecords(value.records);
  }

  validateProductRecords(records) {
    return records.map((record, index) => {
      const { error, value } = productImportRecordSchema.validate(record, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        throw new ApiError(
          400,
          "Invalid import structure",
          "INVALID_IMPORT_STRUCTURE",
          this.formatJoiErrors(error, index),
        );
      }

      return value;
    });
  }

  validateInventoryRecords(records) {
    return records.map((record, index) => {
      const { error, value } = inventoryImportRecordSchema.validate(record, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        throw new ApiError(
          400,
          "Invalid import structure",
          "INVALID_IMPORT_STRUCTURE",
          this.formatJoiErrors(error, index),
        );
      }

      return value;
    });
  }

  async importProducts(records, context) {
    const skus = new Set();

    for (const record of records) {
      if (skus.has(record.sku)) {
        throw new ApiError(409, "Duplicated product SKU in import file", "IMPORT_CONFLICT");
      }
      skus.add(record.sku);

      const existing = await this.productDAO.findBySku(record.sku);
      if (existing) {
        throw new ApiError(409, "Product SKU already exists", "IMPORT_CONFLICT");
      }
    }

    const imported = [];
    for (const record of records) {
      imported.push(await this.productService.create(record, context));
    }

    return imported;
  }

  async importInventory(records, context) {
    const slotIds = new Set();

    for (const record of records) {
      if (slotIds.has(record.slot_id)) {
        throw new ApiError(409, "Duplicated slot inventory in import file", "IMPORT_CONFLICT");
      }
      slotIds.add(record.slot_id);

      await this.inventoryService.validateRelationsAndQuantities(record);

      const existing = await this.inventoryDAO.findBySlotId(record.slot_id);
      if (existing) {
        throw new ApiError(409, "Slot already has inventory", "IMPORT_CONFLICT");
      }
    }

    const imported = [];
    for (const record of records) {
      imported.push(await this.inventoryService.create(record, context));
    }

    return imported;
  }

  formatJoiErrors(error, recordIndex = null) {
    return error.details.map((detail) => ({
      record_index: recordIndex,
      field: detail.path.join("."),
      message: detail.message,
    }));
  }

  async logJson(eventType, { context, entity, details }) {
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
      table: entity,
      record_id: null,
      details,
    });
  }
}

module.exports = ImportExportService;
