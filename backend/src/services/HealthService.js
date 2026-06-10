const IService = require("../interfaces/IService");
const ApiError = require("../utils/ApiError");

class HealthService extends IService {
  getStatus() {
    return {
      status: "ok",
      service: "backend",
      environment: process.env.NODE_ENV || "development",
    };
  }

  create() {
    throw new ApiError(501, "Not implemented", "NOT_IMPLEMENTED");
  }

  getById() {
    return this.getStatus();
  }

  list() {
    return this.getStatus();
  }

  update() {
    throw new ApiError(501, "Not implemented", "NOT_IMPLEMENTED");
  }

  delete() {
    throw new ApiError(501, "Not implemented", "NOT_IMPLEMENTED");
  }
}

module.exports = HealthService;
