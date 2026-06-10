const request = require("supertest");
const { convert } = require("xmlbuilder2");

const app = require("../src/app");
const mysql = require("../src/config/mysql");
const mongodb = require("../src/config/mongodb");
const LogService = require("../src/services/LogService");
const { hashPassword } = require("../src/utils/password");

const runId = Date.now();
const adminEmail = `logs.admin.${runId}@example.com`;
const commonEmail = `logs.user.${runId}@example.com`;
const targetUsername = `xml.target.${runId}@example.com`;
const otherUsername = `xml.other.${runId}@example.com`;

async function createUser({ email, role }) {
  const passwordHash = await hashPassword("StrongPass123");
  const [result] = await mysql.query(
    `INSERT INTO users (name, email, password_hash, role, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [`Logs ${role}`, email, passwordHash, role],
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
    commonEmail,
  ]);
  const userIds = users.map((user) => user.id);

  if (userIds.length > 0) {
    await mysql.query("DELETE FROM wallets WHERE user_id IN (?)", [userIds]);
    await mysql.query("DELETE FROM users WHERE id IN (?)", [userIds]);
  }

  const db = await mongodb.getMongoDb();
  await db.collection("logs").deleteMany({
    $or: [
      { username: { $in: [adminEmail, commonEmail, targetUsername, otherUsername] } },
      { "details.test_run_id": runId },
    ],
  });
}

function parseXml(xml) {
  return convert(xml, { format: "object" });
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

async function seedLogs() {
  const logService = new LogService();
  await logService.create({
    timestamp: new Date("2026-06-10T10:00:00.000Z"),
    event_type: "LOGIN_SUCCESS",
    action: "POST /api/auth/login",
    user_id: 501,
    username: targetUsername,
    method: "POST",
    endpoint: "/api/auth/login",
    status_code: 200,
    response_time_ms: 20,
    ip: "127.0.0.10",
    user_agent: "jest",
    details: { description: "Target login", test_run_id: runId },
  });
  await logService.create({
    timestamp: new Date("2026-06-11T11:30:00.000Z"),
    event_type: "CREATE",
    action: "POST /api/products",
    user_id: 501,
    username: targetUsername,
    method: "POST",
    endpoint: "/api/products",
    status_code: 201,
    response_time_ms: 35,
    ip: "127.0.0.11",
    user_agent: "jest",
    table: "products",
    record_id: 9001,
    after: { id: 9001, sku: `XML-${runId}` },
    details: { description: "Product created", test_run_id: runId },
  });
  await logService.create({
    timestamp: new Date("2026-06-12T12:00:00.000Z"),
    event_type: "ERROR",
    action: "GET /api/protected",
    user_id: 777,
    username: otherUsername,
    method: "GET",
    endpoint: "/api/protected",
    status_code: 403,
    response_time_ms: 12,
    ip: "127.0.0.12",
    user_agent: "jest",
    error: { name: "ApiError", message: "Forbidden" },
    details: { description: "Other user error", test_run_id: runId },
  });
}

describe("admin XML log export", () => {
  let admin;
  let commonUser;

  beforeAll(async () => {
    await cleanup();
    admin = await createUser({ email: adminEmail, role: "ADMIN" });
    commonUser = await createUser({ email: commonEmail, role: "USER" });
    await seedLogs();
  });

  afterAll(async () => {
    await cleanup();
    await mysql.closePool();
    await mongodb.closeMongoConnection();
  });

  test("exports XML without filters as admin", async () => {
    const response = await request(app)
      .get("/api/admin/logs/export/xml")
      .set("Authorization", `Bearer ${admin.token}`)
      .expect(200);

    expect(response.text).toContain("logs_export");
    expect(response.text).toContain(targetUsername);
    expect(response.text).toContain(otherUsername);
  });

  test("exports XML filtered by user", async () => {
    const response = await request(app)
      .get("/api/admin/logs/export/xml")
      .set("Authorization", `Bearer ${admin.token}`)
      .query({ user: targetUsername })
      .expect(200);

    expect(response.text).toContain(targetUsername);
    expect(response.text).not.toContain(otherUsername);
  });

  test("exports XML filtered by date range", async () => {
    const response = await request(app)
      .get("/api/admin/logs/export/xml")
      .set("Authorization", `Bearer ${admin.token}`)
      .query({
        start_date: "2026-06-11T00:00:00.000Z",
        end_date: "2026-06-11T23:59:59.999Z",
      })
      .expect(200);

    expect(response.text).toContain("Product created");
    expect(response.text).not.toContain("Target login");
    expect(response.text).not.toContain("Other user error");
  });

  test("exports XML filtered by event type", async () => {
    const response = await request(app)
      .get("/api/admin/logs/export/xml")
      .set("Authorization", `Bearer ${admin.token}`)
      .query({ event_type: "ERROR" })
      .expect(200);

    expect(response.text).toContain("<event_type>ERROR</event_type>");
    expect(response.text).toContain("Other user error");
    expect(response.text).not.toContain("<event_type>CREATE</event_type>");
  });

  test("sets XML download content type", async () => {
    const response = await request(app)
      .get("/api/admin/logs/export/xml")
      .set("Authorization", `Bearer ${admin.token}`)
      .expect(200);

    expect(response.headers["content-type"]).toMatch(/application\/xml/);
    expect(response.headers["content-disposition"]).toMatch(/logs-export\.xml/);
  });

  test("returns organized XML structure", async () => {
    const response = await request(app)
      .get("/api/admin/logs/export/xml")
      .set("Authorization", `Bearer ${admin.token}`)
      .query({ user: targetUsername, event_type: "CREATE" })
      .expect(200);

    const parsed = parseXml(response.text);
    const root = parsed.logs_export;
    const logs = asArray(root.logs.log);

    expect(root.generated_at).toBeTruthy();
    expect(root.filters.user).toBe(targetUsername);
    expect(root.filters.event_type).toBe("CREATE");
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      user: targetUsername,
      action: "POST /api/products",
      event_type: "CREATE",
      ip: "127.0.0.11",
    });
    expect(logs[0].linked_data.table).toBe("products");
    expect(logs[0].linked_data.after.sku).toBe(`XML-${runId}`);
  });

  test("rejects XML export for non-admin users", async () => {
    const response = await request(app)
      .get("/api/admin/logs/export/xml")
      .set("Authorization", `Bearer ${commonUser.token}`)
      .expect(403);

    expect(response.body.error.code).toBe("FORBIDDEN");
  });
});
