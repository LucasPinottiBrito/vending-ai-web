const IService = require("../interfaces/IService");
const UserDAO = require("../dao/UserDAO");
const LogService = require("./LogService");
const ApiError = require("../utils/ApiError");
const { hashPassword, comparePassword } = require("../utils/password");
const { signToken } = require("../utils/jwt");
const { sanitizeUser } = require("../models/UserModel");

class AuthService extends IService {
  constructor(userDAO = new UserDAO(), logService = new LogService()) {
    super();
    this.userDAO = userDAO;
    this.logService = logService;
  }

  async register(data, context = {}) {
    const normalizedEmail = data.email.toLowerCase();
    const existingUser = await this.userDAO.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ApiError(409, "Email already registered", "EMAIL_ALREADY_REGISTERED");
    }

    const passwordHash = await hashPassword(data.password);
    let user;

    try {
      user = await this.userDAO.create({
        name: data.name,
        email: normalizedEmail,
        password_hash: passwordHash,
        role: "USER",
        is_active: 1,
      });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new ApiError(409, "Email already registered", "EMAIL_ALREADY_REGISTERED");
      }

      throw error;
    }

    const safeUser = sanitizeUser(user);
    const token = this.createToken(safeUser);

    return { user: safeUser, token };
  }

  async login(data, context = {}) {
    const normalizedEmail = data.email.toLowerCase();
    const user = await this.userDAO.findByEmail(normalizedEmail);

    if (!user || !user.is_active) {
      await this.logAuthEvent("LOGIN_FAILURE", {
        context,
        statusCode: 401,
        details: {
          reason: "invalid_credentials",
          email_attempted: normalizedEmail,
        },
      });
      throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const passwordMatches = await comparePassword(data.password, user.password_hash);

    if (!passwordMatches) {
      await this.logAuthEvent("LOGIN_FAILURE", {
        context,
        statusCode: 401,
        user,
        details: {
          reason: "invalid_credentials",
          email_attempted: normalizedEmail,
        },
      });
      throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const safeUser = sanitizeUser(user);
    const token = this.createToken(safeUser);

    await this.logAuthEvent("LOGIN_SUCCESS", {
      context,
      statusCode: 200,
      user,
      details: { auth_provider: "local" },
    });

    return { user: safeUser, token };
  }

  async me(authUser) {
    const user = await this.userDAO.findById(authUser.id);

    if (!user || !user.is_active) {
      throw new ApiError(401, "Authenticated user is not active", "USER_INACTIVE");
    }

    return { user: sanitizeUser(user) };
  }

  async logout(authUser, context = {}) {
    await this.logAuthEvent("LOGOUT", {
      context,
      statusCode: 200,
      user: authUser,
      details: { auth_provider: "local" },
    });

    return { logged_out: true };
  }

  createToken(user) {
    return signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async logAuthEvent(eventType, { context, statusCode, user = null, details = {} }) {
    await this.logService.create({
      event_type: eventType,
      action: `${context.method || null} ${context.endpoint || null}`,
      method: context.method || null,
      endpoint: context.endpoint || null,
      status_code: statusCode,
      response_time_ms: context.response_time_ms || 0,
      ip: context.ip || null,
      user_agent: context.user_agent || null,
      user_id: user?.id || user?.user_id || null,
      username: user?.email || user?.username || details.email_attempted || null,
      details,
    });
  }

  async create(data, context) {
    return this.register(data, context);
  }

  async getById(id) {
    const user = await this.userDAO.findById(id);
    return sanitizeUser(user);
  }

  async list(filters) {
    const users = await this.userDAO.findAll(filters);
    return users.map(sanitizeUser);
  }

  async update(id, data) {
    const user = await this.userDAO.update(id, data);
    return sanitizeUser(user);
  }

  async delete(id) {
    const user = await this.userDAO.delete(id);
    return sanitizeUser(user);
  }
}

module.exports = AuthService;
