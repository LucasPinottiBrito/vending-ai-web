const request = require("supertest");

const app = require("../src/app");
const mysql = require("../src/config/mysql");
const mongodb = require("../src/config/mongodb");
const { hashPassword } = require("../src/utils/password");

const runId = Date.now();
const adminEmail = `import.admin.${runId}@example.com`;
const userEmail = `import.user.${runId}@example.com`;
const skuPrefix = `IMPORT-JSON-${runId}`;
const machineSlugPrefix = `import-json-${runId}`;

async function createUser({ email, role }) {
  const passwordHash = await hashPassword("StrongPass123");
  const [result] = await mysql.query(
    `INSERT INTO users (name, email, password_hash, role, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [`Import ${role}`, email, passwordHash, role],
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

async function createProduct(suffix = "BASE") {
  const [result] = await mysql.query(
    `INSERT INTO products (sku, name, description, category, price_cents, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [
      `${skuPrefix}-${suffix}`,
      `Import Product ${suffix}`,
      "Created for import/export tests",
      "Import",
      1234,
    ],
  );

  const [rows] = await mysql.query("SELECT * FROM products WHERE id = ?", [result.insertId]);
  return rows[0];
}

async function createMachineWithSlot(suffix) {
  const [machineResult] = await mysql.query(
    `INSERT INTO machines (name, slug, location, status, is_active)
     VALUES (?, ?, ?, 'ONLINE', 1)`,
    [`Import Machine ${suffix}`, `${machineSlugPrefix}-${suffix.toLowerCase()}`, "Lab Import"],
  );

  const [slotResult] = await mysql.query(
    `INSERT INTO slots (machine_id, code, motor_id, sensor_column_id, is_enabled)
     VALUES (?, ?, ?, ?, 1)`,
    [machineResult.insertId, `I${suffix}`, Number(runId % 100000) + suffix.length, Number(runId % 100000) + suffix.length + 100],
  );

  return {
    machine_id: machineResult.insertId,
    slot_id: slotResult.insertId,
  };
}

async function cleanup() {
  const [machines] = await mysql.query("SELECT id FROM machines WHERE slug LIKE ?", [
    `${machineSlugPrefix}%`,
  ]);
  const machineIds = machines.map((machine) => machine.id);

  if (machineIds.length > 0) {
    await mysql.query("DELETE FROM inventory WHERE machine_id IN (?)", [machineIds]);
    await mysql.query("DELETE FROM slots WHERE machine_id IN (?)", [machineIds]);
    await mysql.query("DELETE FROM machines WHERE id IN (?)", [machineIds]);
  }

  const [products] = await mysql.query("SELECT id FROM products WHERE sku LIKE ?", [`${skuPrefix}%`]);
  const productIds = products.map((product) => product.id);

  if (productIds.length > 0) {
    await mysql.query("DELETE FROM products WHERE id IN (?)", [productIds]);
  }

  const [users] = await mysql.query("SELECT id FROM users WHERE email IN (?, ?)", [adminEmail, userEmail]);
  const userIds = users.map((user) => user.id);

  if (userIds.length > 0) {
    await mysql.query("DELETE FROM wallets WHERE user_id IN (?)", [userIds]);
    await mysql.query("DELETE FROM users WHERE id IN (?)", [userIds]);
  }

  const db = await mongodb.getMongoDb();
  await db.collection("logs").deleteMany({
    $or: [
      { username: adminEmail },
      { username: userEmail },
      { "details.entity": { $in: ["products", "inventory"] }, "details.test_run_id": runId },
      { "after.sku": { $regex: `^${skuPrefix}` } },
      { "before.sku": { $regex: `^${skuPrefix}` } },
    ],
  });
}

function jsonFile(payload, filename = "import.json") {
  return {
    buffer: Buffer.from(JSON.stringify(payload, null, 2)),
    options: { filename, contentType: "application/json" },
  };
}

async function countImportExportLogs() {
  const db = await mongodb.getMongoDb();
  return db
    .collection("logs")
    .find({
      username: adminEmail,
      event_type: { $in: ["IMPORT_JSON", "EXPORT_JSON"] },
    })
    .toArray();
}

describe("admin JSON import/export", () => {
  let admin;
  let user;
  let exportProduct;
  let exportInventory;
  let importInventoryTarget;

  beforeAll(async () => {
    await cleanup();
    admin = await createUser({ email: adminEmail, role: "ADMIN" });
    user = await createUser({ email: userEmail, role: "USER" });

    exportProduct = await createProduct("EXPORT");
    const exportSlot = await createMachineWithSlot("EXPORT");
    const [inventoryResult] = await mysql.query(
      `INSERT INTO inventory
        (machine_id, slot_id, product_id, quantity_available, quantity_reserved, min_quantity_alert)
       VALUES (?, ?, ?, 7, 1, 2)`,
      [exportSlot.machine_id, exportSlot.slot_id, exportProduct.id],
    );
    const [inventoryRows] = await mysql.query("SELECT * FROM inventory WHERE id = ?", [
      inventoryResult.insertId,
    ]);
    exportInventory = inventoryRows[0];

    const importProduct = await createProduct("INV-PRODUCT");
    const importSlot = await createMachineWithSlot("IMPORTINV");
    importInventoryTarget = {
      machine_id: importSlot.machine_id,
      slot_id: importSlot.slot_id,
      product_id: importProduct.id,
    };
  });

  afterAll(async () => {
    await cleanup();
    await mysql.closePool();
    await mongodb.closeMongoConnection();
  });

  test("exports products as readable JSON for admin", async () => {
    const response = await request(app)
      .get("/api/admin/export/json")
      .set("Authorization", `Bearer ${admin.token}`)
      .query({ entity: "products" })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.export.entity).toBe("products");
    expect(response.body.data.export.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: exportProduct.id,
          sku: `${skuPrefix}-EXPORT`,
        }),
      ]),
    );
  });

  test("exports inventory as readable JSON for admin", async () => {
    const response = await request(app)
      .get("/api/admin/export/json")
      .set("Authorization", `Bearer ${admin.token}`)
      .query({ entity: "inventory" })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.export.entity).toBe("inventory");
    expect(response.body.data.export.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: exportInventory.id,
          machine_id: exportInventory.machine_id,
          slot_id: exportInventory.slot_id,
          product_id: exportInventory.product_id,
        }),
      ]),
    );
  });

  test("imports valid products JSON as admin", async () => {
    const file = jsonFile({
      entity: "products",
      records: [
        {
          sku: `${skuPrefix}-VALID-PRODUCT`,
          name: "Imported Valid Product",
          description: "Imported from JSON",
          category: "Import",
          price_cents: 2500,
          image_path: null,
          is_active: true,
        },
      ],
    });

    const response = await request(app)
      .post("/api/admin/import/json")
      .set("Authorization", `Bearer ${admin.token}`)
      .query({ entity: "products" })
      .attach("file", file.buffer, file.options)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.imported_count).toBe(1);
    expect(response.body.data.products[0]).toMatchObject({
      sku: `${skuPrefix}-VALID-PRODUCT`,
      price_cents: 2500,
    });
  });

  test("imports valid inventory JSON as admin", async () => {
    const file = jsonFile({
      entity: "inventory",
      records: [
        {
          machine_id: importInventoryTarget.machine_id,
          slot_id: importInventoryTarget.slot_id,
          product_id: importInventoryTarget.product_id,
          quantity_available: 5,
          quantity_reserved: 0,
          min_quantity_alert: 1,
        },
      ],
    });

    const response = await request(app)
      .post("/api/admin/import/json")
      .set("Authorization", `Bearer ${admin.token}`)
      .query({ entity: "inventory" })
      .attach("file", file.buffer, file.options)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.imported_count).toBe(1);
    expect(response.body.data.inventory[0]).toMatchObject({
      machine_id: importInventoryTarget.machine_id,
      slot_id: importInventoryTarget.slot_id,
      product_id: importInventoryTarget.product_id,
      quantity_available: 5,
      quantity_reserved: 0,
    });
  });

  test("rejects import from common user", async () => {
    const file = jsonFile({ entity: "products", records: [] });

    const response = await request(app)
      .post("/api/admin/import/json")
      .set("Authorization", `Bearer ${user.token}`)
      .query({ entity: "products" })
      .attach("file", file.buffer, file.options)
      .expect(403);

    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  test("rejects malformed JSON file", async () => {
    const response = await request(app)
      .post("/api/admin/import/json")
      .set("Authorization", `Bearer ${admin.token}`)
      .query({ entity: "products" })
      .attach("file", Buffer.from("{ invalid json"), {
        filename: "broken.json",
        contentType: "application/json",
      })
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_JSON_FILE");
  });

  test("rejects incorrect import structure", async () => {
    const file = jsonFile({
      entity: "products",
      records: [{ sku: `${skuPrefix}-MISSING-FIELDS` }],
    });

    const response = await request(app)
      .post("/api/admin/import/json")
      .set("Authorization", `Bearer ${admin.token}`)
      .query({ entity: "products" })
      .attach("file", file.buffer, file.options)
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_IMPORT_STRUCTURE");
  });

  test("rejects invalid entity", async () => {
    const response = await request(app)
      .get("/api/admin/export/json")
      .set("Authorization", `Bearer ${admin.token}`)
      .query({ entity: "users" })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  test("records import and export logs in MongoDB", async () => {
    const logs = await countImportExportLogs();

    expect(logs.some((log) => log.event_type === "EXPORT_JSON" && log.details.entity === "products")).toBe(true);
    expect(logs.some((log) => log.event_type === "EXPORT_JSON" && log.details.entity === "inventory")).toBe(true);
    expect(logs.some((log) => log.event_type === "IMPORT_JSON" && log.details.entity === "products")).toBe(true);
    expect(logs.some((log) => log.event_type === "IMPORT_JSON" && log.details.entity === "inventory")).toBe(true);
  });
});
