const request = require("supertest");

const app = require("../src/app");
const mysql = require("../src/config/mysql");
const mongodb = require("../src/config/mongodb");

const runId = Date.now();
const primaryEmail = `auth.${runId}@example.com`;
const duplicateEmail = `duplicate.${runId}@example.com`;

async function cleanupEmail(email) {
  const pool = mysql.getPool();
  const [users] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
  const userIds = users.map((user) => user.id);

  if (userIds.length > 0) {
    await pool.query("DELETE FROM wallets WHERE user_id IN (?)", [userIds]);
    await pool.query("DELETE FROM users WHERE id IN (?)", [userIds]);
  }

  const db = await mongodb.getMongoDb();
  await db.collection("logs").deleteMany({
    $or: [
      { username: email },
      { "details.email_attempted": email },
    ],
  });
}

async function findUserByEmail(email) {
  const [rows] = await mysql.query(
    "SELECT id, name, email, password_hash, role, is_active, created_at, updated_at FROM users WHERE email = ?",
    [email],
  );
  return rows[0] || null;
}

async function findWalletByUserId(userId) {
  const [rows] = await mysql.query("SELECT id, user_id, balance_cents FROM wallets WHERE user_id = ?", [
    userId,
  ]);
  return rows[0] || null;
}

async function findLogsByEmail(email) {
  const db = await mongodb.getMongoDb();
  return db
    .collection("logs")
    .find({
      $or: [
        { username: email },
        { "details.email_attempted": email },
      ],
    })
    .sort({ timestamp: 1 })
    .toArray();
}

describe("auth routes", () => {
  beforeAll(async () => {
    await cleanupEmail(primaryEmail);
    await cleanupEmail(duplicateEmail);
  });

  afterAll(async () => {
    await cleanupEmail(primaryEmail);
    await cleanupEmail(duplicateEmail);
    await mysql.closePool();
    await mongodb.closeMongoConnection();
  });

  test("registers user without returning password_hash and creates wallet", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Auth Test User",
        email: primaryEmail,
        password: "StrongPass123",
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(response.body.data.user).toMatchObject({
      name: "Auth Test User",
      email: primaryEmail,
      role: "USER",
    });
    expect(response.body.data.user.password_hash).toBeUndefined();

    const user = await findUserByEmail(primaryEmail);
    expect(user.password_hash).toEqual(expect.any(String));
    expect(user.password_hash).not.toBe("StrongPass123");

    const wallet = await findWalletByUserId(user.id);
    expect(wallet).toMatchObject({
      user_id: user.id,
      balance_cents: 0,
    });
  });

  test("prevents duplicate email registration", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        name: "Duplicate User",
        email: duplicateEmail,
        password: "StrongPass123",
      })
      .expect(201);

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Duplicate User Again",
        email: duplicateEmail,
        password: "StrongPass123",
      })
      .expect(409);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "EMAIL_ALREADY_REGISTERED",
      },
    });
  });

  test("logs in successfully and records LOGIN_SUCCESS", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: primaryEmail,
        password: "StrongPass123",
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(response.body.data.user.email).toBe(primaryEmail);
    expect(response.body.data.user.password_hash).toBeUndefined();

    const logs = await findLogsByEmail(primaryEmail);
    expect(logs.some((log) => log.event_type === "LOGIN_SUCCESS")).toBe(true);
  });

  test("rejects login with wrong password and records LOGIN_FAILURE", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: primaryEmail,
        password: "WrongPass123",
      })
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "INVALID_CREDENTIALS",
      },
    });

    const logs = await findLogsByEmail(primaryEmail);
    expect(logs.some((log) => log.event_type === "LOGIN_FAILURE")).toBe(true);
  });

  test("rejects private route without token", async () => {
    const response = await request(app).get("/api/auth/me").expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "AUTH_TOKEN_REQUIRED",
      },
    });
  });

  test("allows private route with token", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({
        email: primaryEmail,
        password: "StrongPass123",
      })
      .expect(200);

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.data.token}`)
      .expect(200);

    expect(response.body.data.user).toMatchObject({
      email: primaryEmail,
      role: "USER",
    });
    expect(response.body.data.user.password_hash).toBeUndefined();
  });

  test("logs out authenticated user and records LOGOUT", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({
        email: primaryEmail,
        password: "StrongPass123",
      })
      .expect(200);

    await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${login.body.data.token}`)
      .expect(200);

    const logs = await findLogsByEmail(primaryEmail);
    expect(logs.some((log) => log.event_type === "LOGOUT")).toBe(true);
  });
});
