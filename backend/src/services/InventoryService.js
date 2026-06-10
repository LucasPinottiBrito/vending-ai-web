const IService = require("../interfaces/IService");
const MachineDAO = require("../dao/MachineDAO");
const SlotDAO = require("../dao/SlotDAO");
const ProductDAO = require("../dao/ProductDAO");
const InventoryDAO = require("../dao/InventoryDAO");
const LogService = require("./LogService");
const ApiError = require("../utils/ApiError");
const { normalizeInventory } = require("../models/InventoryModel");

class InventoryService extends IService {
  constructor(
    inventoryDAO = new InventoryDAO(),
    machineDAO = new MachineDAO(),
    slotDAO = new SlotDAO(),
    productDAO = new ProductDAO(),
    logService = new LogService(),
  ) {
    super();
    this.inventoryDAO = inventoryDAO;
    this.machineDAO = machineDAO;
    this.slotDAO = slotDAO;
    this.productDAO = productDAO;
    this.logService = logService;
  }

  async create(data, context = {}) {
    await this.validateRelationsAndQuantities(data);

    const existing = await this.inventoryDAO.findBySlotId(data.slot_id);
    if (existing) {
      throw new ApiError(409, "Slot already has inventory", "INVENTORY_SLOT_ALREADY_EXISTS");
    }

    const inventory = normalizeInventory(await this.inventoryDAO.create(data));
    await this.logCrud("CREATE", {
      context,
      recordId: inventory.id,
      after: inventory,
    });

    return inventory;
  }

  async getById(id) {
    const inventory = normalizeInventory(await this.inventoryDAO.findById(id));
    if (!inventory) {
      throw new ApiError(404, "Inventory not found", "INVENTORY_NOT_FOUND");
    }

    return inventory;
  }

  async list(filters = {}) {
    if (filters.machine_id) {
      const machine = await this.machineDAO.findById(filters.machine_id);
      if (!machine) {
        throw new ApiError(404, "Machine not found", "MACHINE_NOT_FOUND");
      }
    }

    return (await this.inventoryDAO.findAll(filters)).map(normalizeInventory);
  }

  async update(id, data, context = {}) {
    const before = normalizeInventory(await this.inventoryDAO.findById(id));
    if (!before) {
      throw new ApiError(404, "Inventory not found", "INVENTORY_NOT_FOUND");
    }

    const candidate = {
      machine_id: data.machine_id ?? before.machine_id,
      slot_id: data.slot_id ?? before.slot_id,
      product_id: data.product_id ?? before.product_id,
      quantity_available: data.quantity_available ?? before.quantity_available,
      quantity_reserved: data.quantity_reserved ?? before.quantity_reserved,
      min_quantity_alert: data.min_quantity_alert ?? before.min_quantity_alert,
    };

    await this.validateRelationsAndQuantities(candidate);

    if (data.slot_id && Number(data.slot_id) !== before.slot_id) {
      const existing = await this.inventoryDAO.findBySlotId(data.slot_id);
      if (existing && Number(existing.id) !== Number(id)) {
        throw new ApiError(409, "Slot already has inventory", "INVENTORY_SLOT_ALREADY_EXISTS");
      }
    }

    const after = normalizeInventory(await this.inventoryDAO.update(id, data));
    await this.logCrud("UPDATE", {
      context,
      recordId: after.id,
      before,
      after,
      details: { changed_fields: Object.keys(data) },
    });

    return after;
  }

  async delete() {
    throw new ApiError(501, "Inventory delete is not implemented", "NOT_IMPLEMENTED");
  }

  async adjust(id, data, context = {}) {
    const before = normalizeInventory(await this.inventoryDAO.findById(id));
    if (!before) {
      throw new ApiError(404, "Inventory not found", "INVENTORY_NOT_FOUND");
    }

    const nextAvailable = before.quantity_available + (data.quantity_available_delta || 0);
    const nextReserved = before.quantity_reserved + (data.quantity_reserved_delta || 0);
    this.assertValidQuantities({
      quantity_available: nextAvailable,
      quantity_reserved: nextReserved,
      min_quantity_alert: before.min_quantity_alert,
    });

    const after = normalizeInventory(await this.inventoryDAO.adjust(id, data));
    await this.logCrud("UPDATE", {
      context,
      recordId: after.id,
      before,
      after,
      details: {
        reason: data.reason || null,
        quantity_available_delta: data.quantity_available_delta || 0,
        quantity_reserved_delta: data.quantity_reserved_delta || 0,
      },
    });

    return after;
  }

  async validateRelationsAndQuantities(data) {
    this.assertValidQuantities(data);

    const machine = await this.machineDAO.findById(data.machine_id);
    if (!machine) {
      throw new ApiError(404, "Machine not found", "MACHINE_NOT_FOUND");
    }

    const slot = await this.slotDAO.findById(data.slot_id);
    if (!slot) {
      throw new ApiError(404, "Slot not found", "SLOT_NOT_FOUND");
    }

    if (Number(slot.machine_id) !== Number(data.machine_id)) {
      throw new ApiError(400, "Slot does not belong to the selected machine", "SLOT_MACHINE_MISMATCH");
    }

    const product = await this.productDAO.findById(data.product_id);
    if (!product || !product.is_active) {
      throw new ApiError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }
  }

  assertValidQuantities(data) {
    const quantityAvailable = Number(data.quantity_available ?? 0);
    const quantityReserved = Number(data.quantity_reserved ?? 0);
    const minQuantityAlert = Number(data.min_quantity_alert ?? 0);

    if (quantityAvailable < 0 || quantityReserved < 0 || minQuantityAlert < 0) {
      throw new ApiError(400, "Inventory quantities cannot be negative", "INVENTORY_NEGATIVE_QUANTITY");
    }

    if (quantityReserved > quantityAvailable) {
      throw new ApiError(
        400,
        "Reserved quantity cannot be greater than available quantity",
        "INVENTORY_RESERVED_EXCEEDS_AVAILABLE",
      );
    }
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
      table: "inventory",
      record_id: recordId,
      before,
      after,
      details,
    });
  }
}

module.exports = InventoryService;
