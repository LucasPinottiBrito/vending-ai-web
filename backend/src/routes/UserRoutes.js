const { Router } = require("express");

const UserController = require("../controllers/UserController");
const { authMiddleware, requireRole } = require("../middlewares/auth_middleware");
const validate = require("../middlewares/validation_middleware");
const { userListQuerySchema } = require("../validators/userValidator");

class UserRoutes {
  constructor(userController = new UserController()) {
    this.router = Router();
    this.userController = userController;
    this.register();
  }

  register() {
    this.router.get(
      "/admin/users",
      authMiddleware,
      requireRole("ADMIN"),
      validate({ query: userListQuerySchema }),
      this.userController.list,
    );
  }

  getRouter() {
    return this.router;
  }
}

module.exports = UserRoutes;
