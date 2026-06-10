const IController = require("../interfaces/IController");
const DashboardService = require("../services/DashboardService");
const { sendSuccess } = require("../utils/response");

class DashboardController extends IController {
  constructor(dashboardService = new DashboardService()) {
    super();
    this.dashboardService = dashboardService;
    this.getSummary = this.getSummary.bind(this);
  }

  async getSummary(req, res, next) {
    try {
      const summary = await this.dashboardService.getSummary();
      return sendSuccess(res, summary, "Dashboard summary found");
    } catch (error) {
      return next(error);
    }
  }

  async create() { throw new Error("Method not implemented."); }
  async getById() { throw new Error("Method not implemented."); }
  async list() { throw new Error("Method not implemented."); }
  async update() { throw new Error("Method not implemented."); }
  async delete() { throw new Error("Method not implemented."); }
}

module.exports = DashboardController;
