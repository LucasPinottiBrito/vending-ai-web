const request = require("supertest");

const app = require("../src/app");
const mysql = require("../src/config/mysql");
const mongodb = require("../src/config/mongodb");

const runId = Date.now();
const userEmail = `sale.user.${runId}@example.com`;
const slugPrefix = `sale-machine-${runId}`;
const skuPrefix = `SALE-PROD-${runId}`;

async function cleanup() {
  const [users] = await mysql.query("SELECT id FROM users WHERE email = ?", [userEmail]);
  const userIds = users.map((user) => user.id);

  const [machines] = await mysql.query("SELECT id FROM machines WHERE slug LIKE ?", [
    `${slugPrefix}%`,
  ]);
  const machineIds = machines.map((machine) => machine.id);

  const [products] = await mysql.query("SELECT id FROM products WHERE sku LIKE ?", [`${skuPrefix}%`]);
  const productIds = products.map((product) => product.id);

  if (userIds.length > 0) {
    await mysql.query("DELETE FROM dispense_commands WHERE sale_id IN (SELECT id FROM sales WHERE user_id IN (?))", [userIds]);
    await mysql.query("DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE user_id IN (?))", [userIds]);
    await mysql.query("DELETE FROM wallet_transactions WHERE user_id IN (?)", [userIds]);
    await mysql.query("DELETE FROM sales WHERE user_id IN (?)", [userIds]);
    await mysql.query("DELETE FROM payments WHERE user_id IN (?)", [userIds]);
    await mysql.query("DELETE FROM wallets WHERE user_id IN (?)", [userIds]);
    await mysql.query("DELETE FROM users WHERE id IN (?)", [userIds]);
  }

  if (machineIds.length > 0) {
    await mysql.query("DELETE FROM inventory WHERE machine_id IN (?)", [machineIds]);
    await mysql.query("DELETE FROM slots WHERE machine_id IN (?)", [machineIds]);
    await mysql.query("DELETE FROM machines WHERE id IN (?)", [machineIds]);
  }

  if (productIds.length > 0) {
    await mysql.query("DELETE FROM products WHERE id IN (?)", [productIds]);
  }

  const db = await mongodb.getMongoDb();
  await db.collection("logs").deleteMany({
    $or: [
      { username: userEmail },
      { "after.slug": { $regex: `^${slugPrefix}` } },
      { "after.sku": { $regex: `^${skuPrefix}` } },
    ],
  });
}

async function registerUser() {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Sale Test User",
      email: userEmail,
      password: "StrongPass123",
    })
    .expect(201);

  return {
    user: response.body.data.user,
    token: response.body.data.token,
  };
}

async function createFixture({ suffix, priceCents = 700, stock = 2, reserved = 0, machineStatus = "ONLINE" }) {
  const [productResult] = await mysql.query(
    `INSERT INTO products (sku, name, category, price_cents, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [`${skuPrefix}-${suffix}`, `Produto Checkout ${suffix}`, "Checkout", priceCents],
  );
  const [machineResult] = await mysql.query(
    `INSERT INTO machines (name, slug, location, status, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [`Maquina Checkout ${suffix}`, `${slugPrefix}-${suffix.toLowerCase()}`, "Bloco T", machineStatus],
  );
  const [slotResult] = await mysql.query(
    `INSERT INTO slots (machine_id, code, motor_id, sensor_column_id, is_enabled)
     VALUES (?, ?, ?, ?, 1)`,
    [machineResult.insertId, `S${suffix}`, machineResult.insertId + 10, machineResult.insertId + 20],
  );
  const [inventoryResult] = await mysql.query(
    `INSERT INTO inventory
      (machine_id, slot_id, product_id, quantity_available, quantity_reserved, min_quantity_alert)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [machineResult.insertId, slotResult.insertId, productResult.insertId, stock, reserved],
  );

  return {
    product_id: productResult.insertId,
    machine_id: machineResult.insertId,
    slot_id: slotResult.insertId,
    inventory_id: inventoryResult.insertId,
  };
}

async function setWalletBalance(userId, balanceCents) {
  await mysql.query("UPDATE wallets SET balance_cents = ? WHERE user_id = ?", [balanceCents, userId]);
}

async function getWallet(userId) {
  const [rows] = await mysql.query("SELECT id, user_id, balance_cents FROM wallets WHERE user_id = ?", [
    userId,
  ]);
  return rows[0] || null;
}

async function getInventory(id) {
  const [rows] = await mysql.query(
    "SELECT id, quantity_available, quantity_reserved FROM inventory WHERE id = ?",
    [id],
  );
  return rows[0] || null;
}

async function getSaleRows(userId) {
  const [rows] = await mysql.query("SELECT * FROM sales WHERE user_id = ? ORDER BY id ASC", [userId]);
  return rows;
}

async function getWalletTransactions(userId) {
  const [rows] = await mysql.query(
    "SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY id ASC",
    [userId],
  );
  return rows;
}

async function getSaleItems(saleId) {
  const [rows] = await mysql.query("SELECT * FROM sale_items WHERE sale_id = ?", [saleId]);
  return rows;
}

async function getDispenseCommands(saleId) {
  const [rows] = await mysql.query("SELECT * FROM dispense_commands WHERE sale_id = ?", [saleId]);
  return rows;
}

async function getCheckoutLogs() {
  const db = await mongodb.getMongoDb();
  return db
    .collection("logs")
    .find({
      username: userEmail,
      table: { $in: ["sales", "sale_items", "wallets", "wallet_transactions", "inventory", "dispense_commands"] },
    })
    .sort({ timestamp: 1 })
    .toArray();
}

describe("sales checkout routes", () => {
  let auth;
  let successFixture;
  let saleId;

  beforeAll(async () => {
    await cleanup();
    auth = await registerUser();
  });

  afterAll(async () => {
    await cleanup();
    await mysql.closePool();
    await mongodb.closeMongoConnection();
  });

  test("checks out one product with sufficient wallet balance", async () => {
    successFixture = await createFixture({ suffix: "OK", priceCents: 700, stock: 3 });
    await setWalletBalance(auth.user.id, 2000);

    const response = await request(app)
      .post("/api/sales/checkout")
      .set("Authorization", `Bearer ${auth.token}`)
      .set("Idempotency-Key", `checkout-${runId}-ok`)
      .send({
        machine_id: successFixture.machine_id,
        slot_id: successFixture.slot_id,
        product_id: successFixture.product_id,
      })
      .expect(201);

    expect(response.body.data.sale).toMatchObject({
      user_id: auth.user.id,
      machine_id: successFixture.machine_id,
      status: "AUTHORIZED",
      payment_method: "WALLET",
      total_cents: 700,
    });
    expect(response.body.data.sale_item).toMatchObject({
      product_id: successFixture.product_id,
      slot_id: successFixture.slot_id,
      quantity: 1,
      unit_price_cents: 700,
      total_cents: 700,
    });
    expect(response.body.data.dispense_command).toMatchObject({
      machine_id: successFixture.machine_id,
      product_id: successFixture.product_id,
      slot_id: successFixture.slot_id,
      status: "PENDING",
    });
    expect(response.body.data.wallet.balance_cents).toBe(1300);
    expect(response.body.data.idempotent).toBe(false);

    saleId = response.body.data.sale.id;
  });

  test("debits wallet, reserves stock and creates sale records", async () => {
    const wallet = await getWallet(auth.user.id);
    const inventory = await getInventory(successFixture.inventory_id);
    const sales = await getSaleRows(auth.user.id);
    const transactions = await getWalletTransactions(auth.user.id);
    const saleItems = await getSaleItems(saleId);
    const commands = await getDispenseCommands(saleId);

    expect(wallet.balance_cents).toBe(1300);
    expect(inventory.quantity_available).toBe(3);
    expect(inventory.quantity_reserved).toBe(1);
    expect(sales.some((sale) => sale.id === saleId && sale.status === "AUTHORIZED")).toBe(true);
    expect(transactions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sale_id: saleId,
          type: "DEBIT",
          amount_cents: 700,
          status: "COMPLETED",
          reference_type: "SALE",
        }),
      ]),
    );
    expect(saleItems).toHaveLength(1);
    expect(commands).toHaveLength(1);
    expect(commands[0].status).toBe("PENDING");
  });

  test("returns existing sale for duplicate checkout with same idempotency key", async () => {
    const response = await request(app)
      .post("/api/sales/checkout")
      .set("Authorization", `Bearer ${auth.token}`)
      .set("Idempotency-Key", `checkout-${runId}-ok`)
      .send({
        machine_id: successFixture.machine_id,
        slot_id: successFixture.slot_id,
        product_id: successFixture.product_id,
      })
      .expect(200);

    const wallet = await getWallet(auth.user.id);
    const inventory = await getInventory(successFixture.inventory_id);
    const commands = await getDispenseCommands(saleId);

    expect(response.body.data.idempotent).toBe(true);
    expect(response.body.data.sale.id).toBe(saleId);
    expect(wallet.balance_cents).toBe(1300);
    expect(inventory.quantity_reserved).toBe(1);
    expect(commands).toHaveLength(1);
  });

  test("blocks checkout without enough balance and keeps data unchanged", async () => {
    const fixture = await createFixture({ suffix: "NOSALDO", priceCents: 1200, stock: 2 });
    await setWalletBalance(auth.user.id, 500);
    const salesBefore = (await getSaleRows(auth.user.id)).length;

    const response = await request(app)
      .post("/api/sales/checkout")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({
        machine_id: fixture.machine_id,
        slot_id: fixture.slot_id,
        product_id: fixture.product_id,
      })
      .expect(402);

    const wallet = await getWallet(auth.user.id);
    const inventory = await getInventory(fixture.inventory_id);
    const salesAfter = (await getSaleRows(auth.user.id)).length;

    expect(response.body.error.code).toBe("INSUFFICIENT_BALANCE");
    expect(wallet.balance_cents).toBe(500);
    expect(inventory.quantity_reserved).toBe(0);
    expect(salesAfter).toBe(salesBefore);
  });

  test("blocks checkout without available stock", async () => {
    const fixture = await createFixture({ suffix: "NOSTOCK", priceCents: 400, stock: 1, reserved: 1 });
    await setWalletBalance(auth.user.id, 5000);

    const response = await request(app)
      .post("/api/sales/checkout")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({
        machine_id: fixture.machine_id,
        slot_id: fixture.slot_id,
        product_id: fixture.product_id,
      })
      .expect(409);

    const inventory = await getInventory(fixture.inventory_id);

    expect(response.body.error.code).toBe("OUT_OF_STOCK");
    expect(inventory.quantity_available).toBe(1);
    expect(inventory.quantity_reserved).toBe(1);
  });

  test("blocks checkout when machine is offline", async () => {
    const fixture = await createFixture({ suffix: "OFFLINE", priceCents: 500, stock: 2, machineStatus: "OFFLINE" });
    await setWalletBalance(auth.user.id, 5000);

    const response = await request(app)
      .post("/api/sales/checkout")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({
        machine_id: fixture.machine_id,
        slot_id: fixture.slot_id,
        product_id: fixture.product_id,
      })
      .expect(409);

    expect(response.body.error.code).toBe("MACHINE_NOT_AVAILABLE");
  });

  test("lists sales, gets sale by id and purchase history", async () => {
    const listResponse = await request(app)
      .get("/api/sales")
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);
    expect(listResponse.body.data.sales).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: saleId, total_cents: 700 })]),
    );

    const detailResponse = await request(app)
      .get(`/api/sales/${saleId}`)
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);
    expect(detailResponse.body.data.sale).toMatchObject({ id: saleId, status: "AUTHORIZED" });
    expect(detailResponse.body.data.items).toHaveLength(1);
    expect(detailResponse.body.data.dispense_commands).toHaveLength(1);

    const purchasesResponse = await request(app)
      .get("/api/users/me/purchases")
      .set("Authorization", `Bearer ${auth.token}`)
      .expect(200);
    expect(purchasesResponse.body.data.purchases).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: saleId })]),
    );
  });

  test("records MongoDB logs for checkout side effects", async () => {
    const logs = await getCheckoutLogs();

    expect(logs.some((log) => log.event_type === "CREATE" && log.table === "sales")).toBe(true);
    expect(logs.some((log) => log.event_type === "CREATE" && log.table === "sale_items")).toBe(true);
    expect(logs.some((log) => log.event_type === "UPDATE" && log.table === "wallets")).toBe(true);
    expect(logs.some((log) => log.event_type === "CREATE" && log.table === "wallet_transactions")).toBe(true);
    expect(logs.some((log) => log.event_type === "UPDATE" && log.table === "inventory")).toBe(true);
    expect(logs.some((log) => log.event_type === "CREATE" && log.table === "dispense_commands")).toBe(true);
  });
});
