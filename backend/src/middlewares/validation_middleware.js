const ApiError = require("../utils/ApiError");

function formatJoiErrors(error) {
  return error.details.map((detail) => ({
    field: detail.path.join("."),
    message: detail.message,
  }));
}

function validate(schemaByLocation) {
  return (req, res, next) => {
    try {
      for (const [location, schema] of Object.entries(schemaByLocation)) {
        if (!schema) continue;

        const { error, value } = schema.validate(req[location], {
          abortEarly: false,
          stripUnknown: true,
        });

        if (error) {
          throw new ApiError(
            400,
            "Validation failed",
            "VALIDATION_ERROR",
            formatJoiErrors(error),
          );
        }

        req[location] = value;
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = validate;
