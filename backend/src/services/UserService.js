const IService = require("../interfaces/IService");
const UserDAO = require("../dao/UserDAO");
const ApiError = require("../utils/ApiError");
const { sanitizeUser } = require("../models/UserModel");

class UserService extends IService {
  constructor(userDAO = new UserDAO()) {
    super();
    this.userDAO = userDAO;
  }

  async create() {
    throw new ApiError(501, "User creation is handled by auth registration", "NOT_IMPLEMENTED");
  }

  async getById(id) {
    const user = sanitizeUser(await this.userDAO.findById(id));
    if (!user) {
      throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }
    return user;
  }

  async list(filters = {}) {
    return (await this.userDAO.findAll(filters)).map(sanitizeUser);
  }

  async update() {
    throw new ApiError(501, "User update is not implemented in this admin view", "NOT_IMPLEMENTED");
  }

  async delete() {
    throw new ApiError(501, "User delete is not implemented in this admin view", "NOT_IMPLEMENTED");
  }
}

module.exports = UserService;
