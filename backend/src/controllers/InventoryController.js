const IController = require("../interfaces/IController");
const InventoryService = require("../services/InventoryService");
const { sendSuccess } = require("../utils/response");

class InventoryController extends IController {
  constructor(inventoryService = new InventoryService()) {
    super();
    this.inventoryService = inventoryService;
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
    this.list = this.list.bind(this);
    this.listByMachine = this.listByMachine.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.adjust = this.adjust.bind(this);
  }

  async create(req, res, next) {
    try {
      const inventory = await this.inventoryService.create(req.body, this.buildContext(req, 201));
      return sendSuccess(res, { inventory }, "Inventory created successfully", 201);
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const inventory = await this.inventoryService.getById(req.params.id, this.buildContext(req));
      return sendSuccess(res, { inventory }, "Inventory found");
    } catch (error) {
      return next(error);
    }
  }

  async list(req, res, next) {
    try {
      const inventory = await this.inventoryService.list(req.query, this.buildContext(req));
      return sendSuccess(res, { inventory }, "Inventory listed");
    } catch (error) {
      return next(error);
    }
  }

  async listByMachine(req, res, next) {
    try {
      const inventory = await this.inventoryService.list(
        { ...req.query, machine_id: req.params.machineId },
        this.buildContext(req),
      );
      return sendSuccess(res, { inventory }, "Machine inventory listed");
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const inventory = await this.inventoryService.update(req.params.id, req.body, this.buildContext(req));
      return sendSuccess(res, { inventory }, "Inventory updated successfully");
    } catch (error) {
      return next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const inventory = await this.inventoryService.delete(req.params.id, this.buildContext(req));
      return sendSuccess(res, { inventory }, "Inventory deleted successfully");
    } catch (error) {
      return next(error);
    }
  }

  async adjust(req, res, next) {
    try {
      const inventory = await this.inventoryService.adjust(req.params.id, req.body, this.buildContext(req));
      return sendSuccess(res, { inventory }, "Inventory adjusted successfully");
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

module.exports = InventoryController;
