const IController = require("../interfaces/IController");
const AuthService = require("../services/AuthService");
const { sendSuccess } = require("../utils/response");
const ApiError = require("../utils/ApiError");

class AuthController extends IController {
  constructor(authService = new AuthService()) {
    super();
    this.authService = authService;
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.me = this.me.bind(this);
    this.logout = this.logout.bind(this);
  }

  async register(req, res, next) {
    try {
      const result = await this.authService.register(req.body, this.buildContext(req));
      return sendSuccess(res, result, "User registered successfully", 201);
    } catch (error) {
      return next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await this.authService.login(req.body, this.buildContext(req));
      return sendSuccess(res, result, "Login successful");
    } catch (error) {
      return next(error);
    }
  }

  async me(req, res, next) {
    try {
      const result = await this.authService.me(req.user);
      return sendSuccess(res, result, "Authenticated user");
    } catch (error) {
      return next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const result = await this.authService.logout(req.user, this.buildContext(req));
      return sendSuccess(res, result, "Logout successful");
    } catch (error) {
      return next(error);
    }
  }

  buildContext(req) {
    return {
      method: req.method,
      endpoint: req.originalUrl,
      ip: req.ip,
      user_agent: req.get("user-agent") || null,
    };
  }

  create(req, res, next) {
    return this.register(req, res, next);
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

module.exports = AuthController;
