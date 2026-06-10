const { Router } = require("express");

const HealthController = require("../controllers/HealthController");

class HealthRoutes {
  constructor(healthController = new HealthController()) {
    this.router = Router();
    this.healthController = healthController;
    this.register();
  }

  register() {
    this.router.get("/health", this.healthController.show);
  }

  getRouter() {
    return this.router;
  }
}

module.exports = HealthRoutes;
