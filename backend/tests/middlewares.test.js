const express = require("express");
const Joi = require("joi");
const request = require("supertest");

const app = require("../src/app");
const mysql = require("../src/config/mysql");
const mongodb = require("../src/config/mongodb");
const ApiError = require("../src/utils/ApiError");
const errorMiddleware = require("../src/middlewares/error_middleware");
const logMiddleware = require("../src/middlewares/log_middleware");
const validate = require("../src/middlewares/validation_middleware");

const runId = Date.now();
const middlewareEmail = `middleware.${runId}@example.com`;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findLog(query, attempts = 10) {
  const db = await mongodb.getMongoDb();

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const log = await db.collection("logs").findOne(query, { sort: { timestamp: -1 } });
    if (log) return log;
    await delay(50);
  }

  return null;
}

async function cleanup() {
  const pool = mysql.getPool();
  const [users] = await pool.query("SELECT id FROM users WHERE email = ?", [middlewareEmail]);
  const userIds = users.map((user) => user.id);

  if (userIds.length > 0) {
    await pool.query("DELETE FROM wallets WHERE user_id IN (?)", [userIds]);
    await pool.query("DELETE FROM users WHERE id IN (?)", [userIds]);
  }

  const db = await mongodb.getMongoDb();
  await db.collection("logs").deleteMany({
    $or: [
      { username: middlewareEmail },
      { user_agent: /^middleware-test-/ },
      { endpoint: "/boom" },
      { endpoint: "/validated" },
    ],
  });
}

describe("mandatory middlewares", () => {
  beforeAll(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await mysql.closePool();
    await mongodb.closeMongoConnection();
  });

  test("blocks private route without token", async () => {
    const response = await request(app).get("/api/auth/me").expect(401);

    expect(response.body.error.code).toBe("AUTH_TOKEN_REQUIRED");
  });

  test("blocks private route with invalid token", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.token.value")
      .expect(401);

    expect(response.body.error.code).toBe("INVALID_TOKEN");
  });

  test("allows private route with valid token and writes req.user", async () => {
    const register = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Middleware User",
        email: middlewareEmail,
        password: "StrongPass123",
      })
      .expect(201);

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${register.body.data.token}`)
      .expect(200);

    expect(response.body.data.user).toMatchObject({
      email: middlewareEmail,
      role: "USER",
    });
  });

  test("blocks inactive authenticated user", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({
        email: middlewareEmail,
        password: "StrongPass123",
      })
      .expect(200);

    await mysql.query("UPDATE users SET is_active = 0 WHERE email = ?", [middlewareEmail]);

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.data.token}`)
      .expect(401);

    expect(response.body.error.code).toBe("USER_INACTIVE");

    await mysql.query("UPDATE users SET is_active = 1 WHERE email = ?", [middlewareEmail]);
  });

  test("records each request in MongoDB without password or full token", async () => {
    const userAgent = `middleware-test-request-${runId}`;

    await request(app)
      .get("/api/health")
      .set("User-Agent", userAgent)
      .set("Authorization", "Bearer should-not-be-logged")
      .expect(200);

    const log = await findLog({ event_type: "REQUEST_ACCESS", user_agent: userAgent });

    expect(log).toMatchObject({
      endpoint: "/api/health",
      method: "GET",
      status_code: 200,
      user_agent: userAgent,
    });
    expect(log.timestamp).toBeInstanceOf(Date);
    expect(log.response_time_ms).toEqual(expect.any(Number));
    expect(JSON.stringify(log)).not.toContain("should-not-be-logged");
    expect(JSON.stringify(log)).not.toContain("password");
  });

  test("records global errors in MongoDB and returns standardized JSON", async () => {
    const errorApp = express();
    const userAgent = `middleware-test-error-${runId}`;

    errorApp.use(logMiddleware);
    errorApp.get("/boom", (req, res, next) => {
      next(new Error("Unexpected middleware failure"));
    });
    errorApp.use(errorMiddleware);

    const response = await request(errorApp).get("/boom").set("User-Agent", userAgent).expect(500);

    expect(response.body).toMatchObject({
      success: false,
      message: "Internal server error",
      error: {
        code: "INTERNAL_SERVER_ERROR",
      },
    });
    expect(JSON.stringify(response.body)).not.toContain("at ");

    const log = await findLog({ event_type: "EXCEPTION", endpoint: "/boom", user_agent: userAgent });

    expect(log.error.message).toBe("Unexpected middleware failure");
    expect(log.stack_trace).toEqual(expect.stringContaining("Unexpected middleware failure"));
  });

  test("returns standardized 400 when body validation fails", async () => {
    const validationApp = express();

    validationApp.use(express.json());
    validationApp.post(
      "/validated",
      validate({
        body: Joi.object({
          name: Joi.string().min(3).required(),
        }),
      }),
      (req, res) => res.status(200).json({ ok: true }),
    );
    validationApp.use(errorMiddleware);

    const response = await request(validationApp).post("/validated").send({ name: "no" }).expect(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Validation failed",
      error: {
        code: "VALIDATION_ERROR",
      },
    });
    expect(response.body.error.details[0]).toMatchObject({ field: "name" });
  });
});
