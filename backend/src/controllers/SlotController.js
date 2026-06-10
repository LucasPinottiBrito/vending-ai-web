const IController = require("../interfaces/IController");
const SlotService = require("../services/SlotService");
const { sendSuccess } = require("../utils/response");

class SlotController extends IController {
  constructor(slotService = new SlotService()) {
    super();
    this.slotService = slotService;
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
    this.list = this.list.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  async create(req, res, next) {
    try {
      const slot = await this.slotService.create(
        { ...req.body, machine_id: req.params.machineId },
        this.buildContext(req, 201),
      );
      return sendSuccess(res, { slot }, "Slot created successfully", 201);
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const slot = await this.slotService.getById(req.params.id, this.buildContext(req));
      return sendSuccess(res, { slot }, "Slot found");
    } catch (error) {
      return next(error);
    }
  }

  async list(req, res, next) {
    try {
      const slots = await this.slotService.list(
        { ...req.query, machine_id: req.params.machineId },
        this.buildContext(req),
      );
      return sendSuccess(res, { slots }, "Slots listed");
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const slot = await this.slotService.update(req.params.id, req.body, this.buildContext(req));
      return sendSuccess(res, { slot }, "Slot updated successfully");
    } catch (error) {
      return next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const slot = await this.slotService.delete(req.params.id, this.buildContext(req));
      return sendSuccess(res, { slot }, "Slot disabled successfully");
    } catch (error) {
      return next(error);
    }
  }

  buildContext(req, statusCode = 200) {
    return {
      method: req.method,
      endpoint: req.originalUrl,
      ip: req.ip,
      user_agent: req.get("user-agent") || null,
      user: req.user || null,
      status_code: statusCode,
    };
  }
}

module.exports = SlotController;
