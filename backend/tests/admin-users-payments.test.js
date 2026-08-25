const request = require("supertest");

const app = require("../src/app");
const mysql = require("../src/config/mysql");
const mongodb = require("../src/config/mongodb");
const { hashPassword } = require("../src/utils/password");

const runId = Date.now();
const adminEmail = `admin.panel.${runId}@example.com`;
const userEmail = `admin.panel.user.${runId}@example.com`;

async function createUser({ name, email, role }) {
  const passwordHash = await hashPassword("StrongPass123");
  const [result] = await mysql.query(
    `INSERT INTO users (name, email, password_hash, role, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [name, email, passwordHash, role],
  );
  await mysql.query("INSERT INTO wallets (user_id, balance_cents) VALUES (?, 0)", [result.insertId]);

  const login = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "StrongPass123" })
    .expect(200);

  return {
    id: result.insertId,
    token: login.body.data.token,
  };
}

async function cleanup() {
  const [users] = await mysql.query("SELECT id FROM users WHERE email IN (?, ?)", [
    adminEmail,
    userEmail,
  ]);
  const userIds = users.map((user) => user.id);

  if (userIds.length > 0) {
    await mysql.query("DELETE FROM wallet_transactions WHERE user_id IN (?)", [userIds]);
    await mysql.query("DELETE FROM payments WHERE user_id IN (?)", [userIds]);
    await mysql.query("DELETE FROM wallets WHERE user_id IN (?)", [userIds]);
    await mysql.query("DELETE FROM users WHERE id IN (?)", [userIds]);
  }

  const db = await mongodb.getMongoDb();
  await db.collection("logs").deleteMany({
    username: { $in: [adminEmail, userEmail] },
  });
}

describe("admin users and payments routes", () => {
  let admin;
  let user;
  let paymentId;

  beforeAll(async () => {
    await cleanup();
    admin = await createUser({ name: "Admin Panel", email: adminEmail, role: "ADMIN" });
    user = await createUser({ name: "Cliente Admin Panel", email: userEmail, role: "USER" });

    const topup = await request(app)
      .post("/api/wallet/topup/mock")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ amount_cents: 3450 })
      .expect(201);
    paymentId = topup.body.data.payment.id;
  });

  afterAll(async () => {
    await cleanup();
    await mysql.closePool();
    await mongodb.closeMongoConnection();
  });

  test("blocks admin user and payment listings for non-admin users", async () => {
    const usersResponse = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${user.token}`)
      .expect(403);
    const paymentsResponse = await request(app)
      .get("/api/admin/payments")
      .set("Authorization", `Bearer ${user.token}`)
      .expect(403);

    expect(usersResponse.body.error.code).toBe("FORBIDDEN");
    expect(paymentsResponse.body.error.code).toBe("FORBIDDEN");
  });

  test("lists users with admin filters", async () => {
    const response = await request(app)
      .get("/api/admin/users")
      .query({ search: "Cliente Admin", role: "USER", active: "active" })
      .set("Authorization", `Bearer ${admin.token}`)
      .expect(200);

    expect(response.body.data.users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: user.id,
          name: "Cliente Admin Panel",
          email: userEmail,
          role: "USER",
          is_active: true,
        }),
      ]),
    );
    expect(response.body.data.users[0].password_hash).toBeUndefined();
  });

  test("lists payments with admin filters and user identity", async () => {
    const response = await request(app)
      .get("/api/admin/payments")
      .query({ status: "PENDING", type: "MOCK_TOPUP" })
      .set("Authorization", `Bearer ${admin.token}`)
      .expect(200);

    expect(response.body.data.payments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: paymentId,
          user_id: user.id,
          user_name: "Cliente Admin Panel",
          user_email: userEmail,
          amount_cents: 3450,
          status: "PENDING",
          type: "MOCK_TOPUP",
        }),
      ]),
    );
  });
});
