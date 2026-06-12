const IService = require("../interfaces/IService");
const MachineDAO = require("../dao/MachineDAO");
const SlotDAO = require("../dao/SlotDAO");
const InventoryDAO = require("../dao/InventoryDAO");
const LogService = require("./LogService");
const ApiError = require("../utils/ApiError");
const { normalizeMachine } = require("../models/MachineModel");
const { normalizeSlot } = require("../models/SlotModel");
const { normalizeInventory } = require("../models/InventoryModel");
const { isSupportedPhysicalSlot } = require("../utils/esp32Command");

class MachineService extends IService {
  constructor(
    machineDAO = new MachineDAO(),
    slotDAO = new SlotDAO(),
    inventoryDAO = new InventoryDAO(),
    logService = new LogService(),
  ) {
    super();
    this.machineDAO = machineDAO;
    this.slotDAO = slotDAO;
    this.inventoryDAO = inventoryDAO;
    this.logService = logService;
  }

  async create(data, context = {}) {
    const existing = await this.machineDAO.findBySlug(data.slug);
    if (existing) {
      throw new ApiError(409, "Machine slug already exists", "MACHINE_SLUG_ALREADY_EXISTS");
    }

    const slotsData = data.slots || [];
    const machineData = {
      ...data,
      is_active: data.is_active === undefined ? 1 : Number(Boolean(data.is_active)),
    };
    delete machineData.slots;

    const machine = normalizeMachine(await this.machineDAO.createWithSlots(machineData, slotsData));
    const slots = (await this.slotDAO.findByMachineId(machine.id)).map(normalizeSlot);
    const machineWithSlots = { ...machine, slots };

    await this.logCrud("CREATE", {
      context,
      table: "machines",
      recordId: machine.id,
      after: machineWithSlots,
    });

    for (const slot of slots) {
      await this.logCrud("CREATE", {
        context,
        table: "slots",
        recordId: slot.id,
        after: slot,
        details: { created_with_machine: true },
      });
    }

    return machineWithSlots;
  }

  async getById(id) {
    const machine = normalizeMachine(await this.machineDAO.findById(id));
    if (!machine) {
      throw new ApiError(404, "Machine not found", "MACHINE_NOT_FOUND");
    }

    return machine;
  }

  async getBySlug(slug) {
    const machine = normalizeMachine(await this.machineDAO.findBySlug(slug));
    if (!machine) {
      throw new ApiError(404, "Machine not found", "MACHINE_NOT_FOUND");
    }

    return machine;
  }

  async getCatalogBySlug(slug) {
    const machine = await this.getBySlug(slug);
    const items = (await this.inventoryDAO.findCatalogByMachineId(machine.id))
      .map(normalizeInventory)
      .filter(isSupportedPhysicalSlot);

    return {
      machine,
      items,
    };
  }

  async list(filters = {}) {
    return (await this.machineDAO.findAll(filters)).map(normalizeMachine);
  }

  async update(id, data, context = {}) {
    const before = normalizeMachine(await this.machineDAO.findById(id));
    if (!before) {
      throw new ApiError(404, "Machine not found", "MACHINE_NOT_FOUND");
    }

    if (data.slug && data.slug !== before.slug) {
      const existing = await this.machineDAO.findBySlug(data.slug);
      if (existing && Number(existing.id) !== Number(id)) {
        throw new ApiError(409, "Machine slug already exists", "MACHINE_SLUG_ALREADY_EXISTS");
      }
    }

    const updateData = { ...data };
    if (data.is_active !== undefined) {
      updateData.is_active = Number(Boolean(data.is_active));
    }

    const after = normalizeMachine(await this.machineDAO.update(id, updateData));
    await this.logCrud("UPDATE", {
      context,
      table: "machines",
      recordId: after.id,
      before,
      after,
      details: { changed_fields: Object.keys(data) },
    });

    return after;
  }

  async delete(id, context = {}) {
    const before = normalizeMachine(await this.machineDAO.findById(id));
    if (!before) {
      throw new ApiError(404, "Machine not found", "MACHINE_NOT_FOUND");
    }

    const after = normalizeMachine(await this.machineDAO.delete(id));
    await this.logCrud("DELETE", {
      context,
      table: "machines",
      recordId: after.id,
      before,
      after,
    });

    return after;
  }

  async logCrud(eventType, { context, table, recordId, before = null, after = null, details = {} }) {
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
      table,
      record_id: recordId,
      before,
      after,
      details,
    });
  }
}

module.exports = MachineService;
