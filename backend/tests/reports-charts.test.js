const request = require("supertest");

const app = require("../src/app");
const mysql = require("../src/config/mysql");
const mongodb = require("../src/config/mongodb");
const { hashPassword } = require("../src/utils/password");

const runId = Date.now();
const adminEmail = `reports.admin.${runId}@example.com`;
const userEmail = `reports.user.${runId}@example.com`;
const skuPrefix = `REPORT-PROD-${runId}`;
const machineSlugPrefix = `report-machine-${runId}`;

async function createUser({ email, role }) {
  const passwordHash = await hashPassword("StrongPass123");
  const [result] = await mysql.query(
    `INSERT INTO users (name, email, password_hash, role, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [`Reports ${role}`, email, passwordHash, role],
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

async function createProduct() {
  const [result] = await mysql.query(
    `INSERT INTO products (sku, name, description, category, price_cents, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [`${skuPrefix}-BASE`, "Report Product", "Report fixture", "Reports", 1000],
  );

  return result.insertId;
}

async function createMachineWithSlot(suffix) {
  const [machineResult] = await mysql.query(
    `INSERT INTO machines (name, slug, location, status, is_active)
     VALUES (?, ?, ?, 'ONLINE', 1)`,
    [`Report Machine ${suffix}`, `${machineSlugPrefix}-${suffix.toLowerCase()}`, "Reports Lab"],
  );

  const [slotResult] = await mysql.query(
    `INSERT INTO slots (machine_id, code, motor_id, sensor_column_id, is_enabled)
     VALUES (?, ?, ?, ?, 1)`,
    [
      machineResult.insertId,
      `R${suffix}`,
      Number(runId % 100000) + suffix.length,
      Number(runId % 100000) + suffix.length + 100,
    ],
  );

  return {
    machineId: machineResult.insertId,
    slotId: slotResult.insertId,
  };
}

async function createSale({ userId, machineId, slotId, productId, status, totalCents, createdAt }) {
  const [saleResult] = await mysql.query(
    `INSERT INTO sales (user_id, machine_id, status, payment_method, total_cents, failure_reason, created_at, updated_at)
     VALUES (?, ?, ?, 'WALLET', ?, ?, ?, ?)`,
    [
      userId,
      machineId,
      status,
      totalCents,
      status === "FAILED" ? "REPORT_FAILURE" : null,
      createdAt,
      createdAt,
    ],
  );

  await mysql.query(
    `INSERT INTO sale_items
      (sale_id, product_id, slot_id, quantity, unit_price_cents, total_cents, created_at)
     VALUES (?, ?, ?, 1, ?, ?, ?)`,
    [saleResult.insertId, productId, slotId, totalCents, totalCents, createdAt],
  );

  return saleResult.insertId;
}

async function cleanup() {
  const [users] = await mysql.query("SELECT id FROM users WHERE email IN (?, ?)", [adminEmail, userEmail]);
  const userIds = users.map((user) => user.id);

  if (userIds.length > 0) {
    await mysql.query("DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE user_id IN (?))", [userIds]);
    await mysql.query("DELETE FROM sales WHERE user_id IN (?)", [userIds]);
    await mysql.query("DELETE FROM wallets WHERE user_id IN (?)", [userIds]);
    await mysql.query("DELETE FROM users WHERE id IN (?)", [userIds]);
  }

  const [machines] = await mysql.query("SELECT id FROM machines WHERE slug LIKE ?", [
    `${machineSlugPrefix}%`,
  ]);
  const machineIds = machines.map((machine) => machine.id);

  if (machineIds.length > 0) {
    await mysql.query("DELETE FROM slots WHERE machine_id IN (?)", [machineIds]);
    await mysql.query("DELETE FROM machines WHERE id IN (?)", [machineIds]);
  }

  const [products] = await mysql.query("SELECT id FROM products WHERE sku LIKE ?", [`${skuPrefix}%`]);
  const productIds = products.map((product) => product.id);

  if (productIds.length > 0) {
    await mysql.query("DELETE FROM products WHERE id IN (?)", [productIds]);
  }

  const db = await mongodb.getMongoDb();
  await db.collection("logs").deleteMany({
    $or: [
      { username: adminEmail },
      { username: userEmail },
      { "details.test_run_id": runId },
      { "details.report_run_id": runId },
    ],
  });
}

async function reportLogs() {
  const db = await mongodb.getMongoDb();
  return db
    .collection("logs")
    .find({
      username: adminEmail,
      event_type: { $in: ["GENERATE_PDF_REPORT", "GENERATE_CHART_DATA"] },
    })
    .toArray();
}

describe("admin reports and charts data endpoints", () => {
  let admin;
  let user;
  let productId;
  let machineA;
  let machineB;

  beforeAll(async () => {
    await cleanup();
    admin = await createUser({ email: adminEmail, role: "ADMIN" });
    user = await createUser({ email: userEmail, role: "USER" });
    productId = await createProduct();
    machineA = await createMachineWithSlot("A");
    machineB = await createMachineWithSlot("B");

    await createSale({
      userId: user.id,
      machineId: machineA.machineId,
      slotId: machineA.slotId,
      productId,
      status: "DISPENSED",
      totalCents: 1000,
      createdAt: "2031-06-01 10:00:00",
    });
    await createSale({
      userId: user.id,
      machineId: machineA.machineId,
      slotId: machineA.slotId,
      productId,
      status: "FAILED",
      totalCents: 700,
      createdAt: "2031-06-15 10:00:00",
    });
    await createSale({
      userId: user.id,
      machineId: machineB.machineId,
      slotId: machineB.slotId,
      productId,
      status: "REFUNDED",
      totalCents: 500,
      createdAt: "2031-07-05 10:00:00",
    });
    await createSale({
      userId: user.id,
      machineId: machineA.machineId,
      slotId: machineA.slotId,
      productId,
      status: "AUTHORIZED",
      totalCents: 800,
      createdAt: "2031-07-20 10:00:00",
    });
  });

  afterAll(async () => {
    await cleanup();
    await mysql.closePool();
    await mongodb.closeMongoConnection();
  });

  test("returns sales report by period with totals and generator", async () => {
    const response = await request(app)
      .get("/api/admin/reports/sales")
      .set("Authorization", `Bearer ${admin.token}`)
      .query({
        start_date: "2031-06-01T00:00:00.000Z",
        end_date: "2031-06-30T23:59:59.999Z",
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.report.period).toMatchObject({
      start_date: "2031-06-01T00:00:00.000Z",
      end_date: "2031-06-30T23:59:59.999Z",
    });
    expect(response.body.data.report.generated_by).toMatchObject({
      id: admin.id,
      email: adminEmail,
    });
    expect(response.body.data.report.summary).toMatchObject({
      total_sold_cents: 1700,
      sales_count: 2,
      failure_count: 1,
      refund_count: 0,
    });
    expect(response.body.data.report.sales).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ machine_id: machineA.machineId, status: "DISPENSED", total_cents: 1000 }),
        expect.objectContaining({ machine_id: machineA.machineId, status: "FAILED", total_cents: 700 }),
      ]),
    );
  });

  test("filters sales report by machine", async () => {
    const response = await request(app)
      .get("/api/admin/reports/sales")
      .set("Authorization", `Bearer ${admin.token}`)
      .query({ machine_id: machineB.machineId })
      .expect(200);

    expect(response.body.data.report.summary).toMatchObject({
      total_sold_cents: 500,
      sales_count: 1,
      refund_count: 1,
    });
    expect(response.body.data.report.sales).toEqual([
      expect.objectContaining({ machine_id: machineB.machineId, status: "REFUNDED" }),
    ]);
  });

  test("filters sales report by status", async () => {
    const response = await request(app)
      .get("/api/admin/reports/sales")
      .set("Authorization", `Bearer ${admin.token}`)
      .query({
        status: "DISPENSED",
        start_date: "2031-01-01T00:00:00.000Z",
        end_date: "2031-12-31T23:59:59.999Z",
      })
      .expect(200);

    expect(response.body.data.report.summary).toMatchObject({
      total_sold_cents: 1000,
      sales_count: 1,
      failure_count: 0,
      refund_count: 0,
    });
    expect(response.body.data.report.sales).toEqual([
      expect.objectContaining({ status: "DISPENSED", total_cents: 1000 }),
    ]);
  });

  test("returns purchase history report filtered by user and period", async () => {
    const response = await request(app)
      .get("/api/admin/reports/purchase-history")
      .set("Authorization", `Bearer ${admin.token}`)
      .query({
        user_id: user.id,
        start_date: "2031-07-01T00:00:00.000Z",
        end_date: "2031-07-31T23:59:59.999Z",
      })
      .expect(200);

    expect(response.body.data.report.user_id).toBe(user.id);
    expect(response.body.data.report.purchases).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "REFUNDED", total_cents: 500 }),
        expect.objectContaining({ status: "AUTHORIZED", total_cents: 800 }),
      ]),
    );
    expect(response.body.data.report.summary).toMatchObject({
      total_spent_cents: 1300,
      purchase_count: 2,
    });
  });

  test("returns monthly sales chart data ready for Chart.js", async () => {
    const response = await request(app)
      .get("/api/admin/charts/sales-by-month")
      .set("Authorization", `Bearer ${admin.token}`)
      .query({ year: 2031 })
      .expect(200);

    const chart = response.body.data.chart;
    expect(chart.labels).toEqual(expect.arrayContaining(["2031-06", "2031-07"]));
    expect(chart.datasets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Quantidade de vendas" }),
        expect.objectContaining({ label: "Total vendido (centavos)" }),
      ]),
    );

    const quantityDataset = chart.datasets.find((dataset) => dataset.label === "Quantidade de vendas");
    const totalDataset = chart.datasets.find((dataset) => dataset.label === "Total vendido (centavos)");
    const juneIndex = chart.labels.indexOf("2031-06");
    const julyIndex = chart.labels.indexOf("2031-07");

    expect(quantityDataset.data[juneIndex]).toBe(2);
    expect(quantityDataset.data[julyIndex]).toBe(2);
    expect(totalDataset.data[juneIndex]).toBe(1700);
    expect(totalDataset.data[julyIndex]).toBe(1300);
  });

  test("report totals match direct MySQL aggregation", async () => {
    const response = await request(app)
      .get("/api/admin/reports/sales")
      .set("Authorization", `Bearer ${admin.token}`)
      .query({ machine_id: machineA.machineId })
      .expect(200);

    const [rows] = await mysql.query(
      "SELECT COUNT(*) AS sales_count, COALESCE(SUM(total_cents), 0) AS total_sold_cents FROM sales WHERE machine_id = ?",
      [machineA.machineId],
    );

    expect(response.body.data.report.summary.sales_count).toBe(Number(rows[0].sales_count));
    expect(response.body.data.report.summary.total_sold_cents).toBe(Number(rows[0].total_sold_cents));
  });

  test("records report and chart logs in MongoDB", async () => {
    const logs = await reportLogs();

    expect(
      logs.some(
        (log) =>
          log.event_type === "GENERATE_PDF_REPORT" &&
          log.details.report_type === "sales" &&
          log.username === adminEmail,
      ),
    ).toBe(true);
    expect(
      logs.some(
        (log) =>
          log.event_type === "GENERATE_PDF_REPORT" &&
          log.details.report_type === "purchase_history" &&
          log.username === adminEmail,
      ),
    ).toBe(true);
    expect(
      logs.some(
        (log) =>
          log.event_type === "GENERATE_CHART_DATA" &&
          log.details.chart_type === "sales_by_month" &&
          log.username === adminEmail,
      ),
    ).toBe(true);
  });
});
