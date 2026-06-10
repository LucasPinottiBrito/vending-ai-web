const ApiError = require("../utils/ApiError");
const { verifyToken } = require("../utils/jwt");
const UserDAO = require("../dao/UserDAO");
const { sanitizeUser } = require("../models/UserModel");

const userDAO = new UserDAO();

function getBearerToken(req) {
  const authorization = req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

async function authMiddleware(req, res, next) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      throw new ApiError(401, "Authentication token is required", "AUTH_TOKEN_REQUIRED");
    }

    const tokenPayload = verifyToken(token);
    const user = await userDAO.findById(tokenPayload.id);

    if (!user || !user.is_active) {
      throw new ApiError(401, "Authenticated user is inactive", "USER_INACTIVE");
    }

    req.user = sanitizeUser(user);
    return next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    return next(new ApiError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication is required", "AUTH_REQUIRED"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Insufficient permission", "FORBIDDEN"));
    }

    return next();
  };
}

module.exports = {
  authMiddleware,
  requireRole,
};
