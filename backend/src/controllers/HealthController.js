const IController = require("../interfaces/IController");
const HealthService = require("../services/HealthService");
const { sendSuccess } = require("../utils/response");
const ApiError = require("../utils/ApiError");

class HealthController extends IController {
  constructor(healthService = new HealthService()) {
    super();
    this.healthService = healthService;
    this.show = this.show.bind(this);
  }

  show(req, res, next) {
    try {
      const status = this.healthService.getStatus();
      return sendSuccess(res, status, "Backend is healthy");
    } catch (error) {
      return next(error);
    }
  }

  create(req, res, next) {
    return next(new ApiError(501, "Not implemented", "NOT_IMPLEMENTED"));
  }

  getById(req, res, next) {
    return next(new ApiError(501, "Not implemented", "NOT_IMPLEMENTED"));
  }

  list(req, res, next) {
    return next(new ApiError(501, "Not implemented", "NOT_IMPLEMENTED"));
  }

  update(req, res, next) {
    return next(new ApiError(501, "Not implemented", "NOT_IMPLEMENTED"));
  }

  delete(req, res, next) {
    return next(new ApiError(501, "Not implemented", "NOT_IMPLEMENTED"));
  }
}

module.exports = HealthController;
