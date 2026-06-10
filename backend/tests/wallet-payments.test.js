const request = require("supertest");

const app = require("../src/app");
const mysql = require("../src/config/mysql");
const mongodb = require("../src/config/mongodb");

const runId = Date.now();
const userEmail = `wallet.${runId}@example.com`;

async function cleanup() {
  const [users] = await mysql.query("SELECT id FROM users WHERE email = ?", [userEmail]);
  const userIds = users.map((user) => user.id);

  if (userIds.length > 0) {
    await mysql.query("DELETE FROM wallet_transactions WHERE user_id IN (?)", [userIds]);
    await mysql.query("DELETE FROM payments WHERE user_id IN (?)", [userIds]);
    await mysql.query("DELETE FROM wallets WHERE user_id IN (?)", [userIds]);
    await mysql.query("DELETE FROM users WHERE id IN (?)", [userIds]);
  }

  const db = await mongodb.getMongoDb();
  await db.collection("logs").deleteMany({ username: userEmail });
}

async function registerUser() {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Wallet Test User",
      email: userEmail,
      password: "StrongPass123",
    })
    .expect(201);

  return {
    user: response.body.data.user,
    token: response.body.data.token,
  };
}

async function findWalletByUserId(userId) {
  const [rows] = await mysql.query("SELECT id, user_id, balance_cents FROM wallets WHERE user_id = ?", [
    userId,
  ]);
  return rows[0] || null;
}

async function findTransactionsByUserId(userId) {
  const [rows] = await mysql.query(
    `SELECT id, wallet_id, user_id, payment_id, type, amount_cents, status, reference_type, description
     FROM wallet_transactions
     WHERE user_id = ?
     ORDER BY id ASC`,
    [userId],
  );
  return rows;
}

async function findWalletLogs() {
  const db = await mongodb.getMongoDb();
  return db
    .collection("logs")
    .find({
      username: userEmail,
      table: { $in: ["payments", "wallets", "wallet_transactions"] },
    })
    .sort({ timestamp: 1 })
    .toArray();
}

describe("wallet and mock payments routes", () => {
  let auth;
  let payment;

  beforeAll(async () => {
    await cleanup();
    auth = await registerUser();
  });

  afterAll(async () => {
    await cleanup();
    await mysql.closePool();
    await mongodb.closeMongoConnection();
  });

  test("gets authenticated wallet balance in cents", async () => {
    const response = await request(app)
      .get("/api/wallet/balance")
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.wallet).toMatchObject({
      user_id: auth.user.id,
      balance_cents: 0,
    });
  });

  test("creates mock top-up as pending payment without crediting balance", async () => {
    const response = await request(app)
      .post("/api/wallet/topup/mock")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ amount_cents: 2500 })
      .expect(201);

    expect(response.body.data.payment).toMatchObject({
      user_id: auth.user.id,
      type: "MOCK_TOPUP",
      provider: "MOCK",
      amount_cents: 2500,
      status: "PENDING",
    });
    expect(response.body.data.payment.provider_payment_id).toEqual(expect.any(String));

    const wallet = await findWalletByUserId(auth.user.id);
    expect(wallet.balance_cents).toBe(0);

    payment = response.body.data.payment;
  });

  test("gets payment by id for authenticated owner", async () => {
    const response = await request(app)
      .get(`/api/payments/${payment.id}`)
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);

    expect(response.body.data.payment).toMatchObject({
      id: payment.id,
      amount_cents: 2500,
      status: "PENDING",
    });
  });

  test("confirms mock payment and credits wallet once", async () => {
    const response = await request(app)
      .post(`/api/payments/${payment.id}/confirm-mock`)
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);

    expect(response.body.data.payment).toMatchObject({
      id: payment.id,
      status: "PAID",
      amount_cents: 2500,
    });
    expect(response.body.data.wallet.balance_cents).toBe(2500);
    expect(response.body.data.transaction).toMatchObject({
      payment_id: payment.id,
      type: "CREDIT",
      amount_cents: 2500,
      status: "COMPLETED",
      reference_type: "MOCK_TOPUP",
    });

    const wallet = await findWalletByUserId(auth.user.id);
    expect(wallet.balance_cents).toBe(2500);
  });

  test("keeps confirmation idempotent and does not duplicate credit", async () => {
    const response = await request(app)
      .post(`/api/payments/${payment.id}/confirm-mock`)
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);

    expect(response.body.data.payment).toMatchObject({
      id: payment.id,
      status: "PAID",
    });
    expect(response.body.data.wallet.balance_cents).toBe(2500);
    expect(response.body.data.idempotent).toBe(true);

    const wallet = await findWalletByUserId(auth.user.id);
    const transactions = await findTransactionsByUserId(auth.user.id);

    expect(wallet.balance_cents).toBe(2500);
    expect(transactions.filter((transaction) => transaction.payment_id === payment.id)).toHaveLength(1);
  });

  test("lists wallet transactions", async () => {
    const response = await request(app)
      .get("/api/wallet/transactions")
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);

    expect(response.body.data.transactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          payment_id: payment.id,
          type: "CREDIT",
          amount_cents: 2500,
          status: "COMPLETED",
        }),
      ]),
    );
  });

  test("records MongoDB logs for mock payment and wallet credit", async () => {
    const logs = await findWalletLogs();

    expect(logs.some((log) => log.event_type === "CREATE" && log.table === "payments")).toBe(true);
    expect(logs.some((log) => log.event_type === "UPDATE" && log.table === "payments")).toBe(true);
    expect(logs.some((log) => log.event_type === "UPDATE" && log.table === "wallets")).toBe(true);
    expect(logs.some((log) => log.event_type === "CREATE" && log.table === "wallet_transactions")).toBe(true);
  });
});
