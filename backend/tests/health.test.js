const request = require("supertest");

const app = require("../src/app");
const mysql = require("../src/config/mysql");
const mongodb = require("../src/config/mongodb");

describe("health routes", () => {
  afterAll(async () => {
    await mysql.closePool();
    await mongodb.closeMongoConnection();
  });

  test("GET /health returns standardized backend status", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toMatchObject({
      success: true,
      message: "Backend is healthy",
      data: {
        status: "ok",
        service: "backend",
      },
    });
    expect(response.body.timestamp).toEqual(expect.any(String));
  });

  test("GET /api/health returns standardized backend status", async () => {
    const response = await request(app).get("/api/health").expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
  });
});
