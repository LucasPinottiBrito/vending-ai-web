const IController = require("../interfaces/IController");
const MachineService = require("../services/MachineService");
const { sendSuccess } = require("../utils/response");

class MachineController extends IController {
  constructor(machineService = new MachineService()) {
    super();
    this.machineService = machineService;
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
    this.getBySlug = this.getBySlug.bind(this);
    this.getCatalogBySlug = this.getCatalogBySlug.bind(this);
    this.list = this.list.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  async create(req, res, next) {
    try {
      const machine = await this.machineService.create(req.body, this.buildContext(req, 201));
      return sendSuccess(res, { machine }, "Machine created successfully", 201);
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const machine = await this.machineService.getById(req.params.id, this.buildContext(req));
      return sendSuccess(res, { machine }, "Machine found");
    } catch (error) {
      return next(error);
    }
  }

  async getBySlug(req, res, next) {
    try {
      const machine = await this.machineService.getBySlug(req.params.slug, this.buildContext(req));
      return sendSuccess(res, { machine }, "Machine found");
    } catch (error) {
      return next(error);
    }
  }

  async getCatalogBySlug(req, res, next) {
    try {
      const catalog = await this.machineService.getCatalogBySlug(req.params.slug, this.buildContext(req));
      return sendSuccess(res, catalog, "Machine catalog found");
    } catch (error) {
      return next(error);
    }
  }

  async list(req, res, next) {
    try {
      const machines = await this.machineService.list(req.query, this.buildContext(req));
      return sendSuccess(res, { machines }, "Machines listed");
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const machine = await this.machineService.update(req.params.id, req.body, this.buildContext(req));
      return sendSuccess(res, { machine }, "Machine updated successfully");
    } catch (error) {
      return next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const machine = await this.machineService.delete(req.params.id, this.buildContext(req));
      return sendSuccess(res, { machine }, "Machine deactivated successfully");
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

module.exports = MachineController;
