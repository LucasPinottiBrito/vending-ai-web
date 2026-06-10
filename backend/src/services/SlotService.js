const IService = require("../interfaces/IService");
const MachineDAO = require("../dao/MachineDAO");
const SlotDAO = require("../dao/SlotDAO");
const LogService = require("./LogService");
const ApiError = require("../utils/ApiError");
const { normalizeSlot } = require("../models/SlotModel");

class SlotService extends IService {
  constructor(
    slotDAO = new SlotDAO(),
    machineDAO = new MachineDAO(),
    logService = new LogService(),
  ) {
    super();
    this.slotDAO = slotDAO;
    this.machineDAO = machineDAO;
    this.logService = logService;
  }

  async create(data, context = {}) {
    const machine = await this.machineDAO.findById(data.machine_id);
    if (!machine) {
      throw new ApiError(404, "Machine not found", "MACHINE_NOT_FOUND");
    }

    const slot = normalizeSlot(
      await this.slotDAO.create({
        ...data,
        is_enabled: data.is_enabled === undefined ? 1 : Number(Boolean(data.is_enabled)),
      }),
    );

    await this.logCrud("CREATE", {
      context,
      recordId: slot.id,
      after: slot,
    });

    return slot;
  }

  async getById(id) {
    const slot = normalizeSlot(await this.slotDAO.findById(id));
    if (!slot) {
      throw new ApiError(404, "Slot not found", "SLOT_NOT_FOUND");
    }

    return slot;
  }

  async list(filters = {}) {
    if (filters.machine_id) {
      const machine = await this.machineDAO.findById(filters.machine_id);
      if (!machine) {
        throw new ApiError(404, "Machine not found", "MACHINE_NOT_FOUND");
      }
    }

    return (await this.slotDAO.findAll(filters)).map(normalizeSlot);
  }

  async update(id, data, context = {}) {
    const before = normalizeSlot(await this.slotDAO.findById(id));
    if (!before) {
      throw new ApiError(404, "Slot not found", "SLOT_NOT_FOUND");
    }

    const updateData = { ...data };
    if (data.is_enabled !== undefined) {
      updateData.is_enabled = Number(Boolean(data.is_enabled));
    }

    const after = normalizeSlot(await this.slotDAO.update(id, updateData));
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
    const before = normalizeSlot(await this.slotDAO.findById(id));
    if (!before) {
      throw new ApiError(404, "Slot not found", "SLOT_NOT_FOUND");
    }

    const after = normalizeSlot(await this.slotDAO.delete(id));
    await this.logCrud("DELETE", {
      context,
      recordId: after.id,
      before,
      after,
    });

    return after;
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
      table: "slots",
      record_id: recordId,
      before,
      after,
      details,
    });
  }
}

module.exports = SlotService;
