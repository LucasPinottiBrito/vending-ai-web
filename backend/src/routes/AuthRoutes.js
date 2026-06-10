const { Router } = require("express");

const AuthController = require("../controllers/AuthController");
const { authMiddleware } = require("../middlewares/auth_middleware");
const validate = require("../middlewares/validation_middleware");
const { registerSchema, loginSchema } = require("../validators/authValidator");

class AuthRoutes {
  constructor(authController = new AuthController()) {
    this.router = Router();
    this.authController = authController;
    this.register();
  }

  register() {
    this.router.post("/auth/register", validate({ body: registerSchema }), this.authController.register);
    this.router.post("/auth/login", validate({ body: loginSchema }), this.authController.login);
    this.router.get("/auth/me", authMiddleware, this.authController.me);
    this.router.post("/auth/logout", authMiddleware, this.authController.logout);
  }

  getRouter() {
    return this.router;
  }
}

module.exports = AuthRoutes;
