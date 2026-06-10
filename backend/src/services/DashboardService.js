const IService = require("../interfaces/IService");
const DashboardDAO = require("../dao/DashboardDAO");

class DashboardService extends IService {
  constructor(dashboardDAO = new DashboardDAO()) {
    super();
    this.dashboardDAO = dashboardDAO;
  }

  async getSummary() {
    return await this.dashboardDAO.getSummary();
  }

  async create() { throw new Error("Method not implemented."); }
  async getById() { throw new Error("Method not implemented."); }
  async list() { throw new Error("Method not implemented."); }
  async update() { throw new Error("Method not implemented."); }
  async delete() { throw new Error("Method not implemented."); }
}

module.exports = DashboardService;
