const IController = require("../interfaces/IController");
const UserService = require("../services/UserService");
const { sendSuccess } = require("../utils/response");

class UserController extends IController {
  constructor(userService = new UserService()) {
    super();
    this.userService = userService;
    this.create = this.create.bind(this);
    this.getById = this.getById.bind(this);
    this.list = this.list.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  async create(req, res, next) {
    try {
      const user = await this.userService.create(req.body, this.buildContext(req, 201));
      return sendSuccess(res, { user }, "User created successfully", 201);
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await this.userService.getById(req.params.id, this.buildContext(req));
      return sendSuccess(res, { user }, "User found");
    } catch (error) {
      return next(error);
    }
  }

  async list(req, res, next) {
    try {
      const users = await this.userService.list(req.query, this.buildContext(req));
      return sendSuccess(res, { users }, "Users listed");
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const user = await this.userService.update(req.params.id, req.body, this.buildContext(req));
      return sendSuccess(res, { user }, "User updated successfully");
    } catch (error) {
      return next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const user = await this.userService.delete(req.params.id, this.buildContext(req));
      return sendSuccess(res, { user }, "User deleted successfully");
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

module.exports = UserController;
