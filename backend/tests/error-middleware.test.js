const express = require("express");
const request = require("supertest");

const ApiError = require("../src/utils/ApiError");
const errorMiddleware = require("../src/middlewares/error_middleware");
const mysql = require("../src/config/mysql");
const mongodb = require("../src/config/mongodb");

describe("error_middleware", () => {
  afterAll(async () => {
    await mysql.closePool();
    await mongodb.closeMongoConnection();
  });

  test("returns standardized JSON for controlled errors", async () => {
    const app = express();

    app.get("/controlled-error", (req, res, next) => {
      next(new ApiError(422, "Invalid payload", "VALIDATION_ERROR", [
        { field: "name", message: "Name is required" },
      ]));
    });
    app.use(errorMiddleware);

    const response = await request(app).get("/controlled-error").expect(422);

    expect(response.body).toMatchObject({
      success: false,
      message: "Invalid payload",
      error: {
        code: "VALIDATION_ERROR",
        details: [{ field: "name", message: "Name is required" }],
      },
    });
    expect(response.body.timestamp).toEqual(expect.any(String));
  });
});
