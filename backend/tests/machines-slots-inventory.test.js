const request = require("supertest");

const app = require("../src/app");
const mysql = require("../src/config/mysql");
const mongodb = require("../src/config/mongodb");
const { hashPassword } = require("../src/utils/password");

const runId = Date.now();
const adminEmail = `msi.admin.${runId}@example.com`;
const userEmail = `msi.user.${runId}@example.com`;
const slugPrefix = `test-machine-${runId}`;
const skuPrefix = `TEST-MSI-${runId}`;

async function createUser({ email, role }) {
  const passwordHash = await hashPassword("StrongPass123");
  const [result] = await mysql.query(
    `INSERT INTO users (name, email, password_hash, role, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [`MSI ${role}`, email, passwordHash, role],
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

async function createProduct(suffix = "PRODUCT") {
  const [result] = await mysql.query(
    `INSERT INTO products (sku, name, category, price_cents, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [`${skuPrefix}-${suffix}`, `Produto ${suffix}`, "MSI", 900],
  );

  const [rows] = await mysql.query("SELECT * FROM products WHERE id = ?", [result.insertId]);
  return rows[0];
}

async function cleanup() {
  const [machines] = await mysql.query("SELECT id FROM machines WHERE slug LIKE ?", [
    `${slugPrefix}%`,
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

  const [users] = await mysql.query("SELECT id FROM users WHERE email IN (?, ?)", [
    adminEmail,
    userEmail,
  ]);
  const userIds = users.map((user) => user.id);

  if (userIds.length > 0) {
    await mysql.query("DELETE FROM wallets WHERE user_id IN (?)", [userIds]);
    await mysql.query("DELETE FROM users WHERE id IN (?)", [userIds]);
  }

  const db = await mongodb.getMongoDb();
  await db.collection("logs").deleteMany({
    $or: [
      { "after.slug": { $regex: `^${slugPrefix}` } },
      { "before.slug": { $regex: `^${slugPrefix}` } },
      { "after.sku": { $regex: `^${skuPrefix}` } },
      { "before.sku": { $regex: `^${skuPrefix}` } },
      { username: adminEmail },
      { username: userEmail },
    ],
  });
}

async function findModuleLogs(eventType) {
  const db = await mongodb.getMongoDb();
  return db
    .collection("logs")
    .find({
      event_type: eventType,
      table: { $in: ["machines", "slots", "inventory"] },
      username: adminEmail,
    })
    .toArray();
}

describe("machines, slots and inventory routes", () => {
  let admin;
  let user;
  let product;
  let machine;
  let slot;
  let inventory;

  beforeAll(async () => {
    await cleanup();
    admin = await createUser({ email: adminEmail, role: "ADMIN" });
    user = await createUser({ email: userEmail, role: "USER" });
    product = await createProduct();
  });

  afterAll(async () => {
    await cleanup();
    await mysql.closePool();
    await mongodb.closeMongoConnection();
  });

  test("creates machine with dynamic slots as admin", async () => {
    const response = await request(app)
      .post("/api/machines")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        slug: `${slugPrefix}-main`,
        name: "Maquina Teste",
        location: "Bloco A",
        status: "ONLINE",
        slots: [
          { code: "A1", motor_id: 1, sensor_column_id: 1 },
          { code: "A2", motor_id: 2, sensor_column_id: 2 },
        ],
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.machine).toMatchObject({
      slug: `${slugPrefix}-main`,
      name: "Maquina Teste",
      status: "ONLINE",
      is_active: true,
    });
    expect(response.body.data.machine.slots).toHaveLength(2);

    machine = response.body.data.machine;
    slot = machine.slots[0];
  });

  test("prevents machine creation as common user", async () => {
    const response = await request(app)
      .post("/api/machines")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        slug: `${slugPrefix}-denied`,
        name: "Maquina Negada",
      })
      .expect(403);

    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  test("lists and gets machine by id and slug", async () => {
    const listResponse = await request(app).get("/api/machines").expect(200);
    expect(listResponse.body.data.machines).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: machine.id, slug: machine.slug })]),
    );

    const idResponse = await request(app).get(`/api/machines/${machine.id}`).expect(200);
    expect(idResponse.body.data.machine.slug).toBe(machine.slug);

    const slugResponse = await request(app).get(`/api/machines/slug/${machine.slug}`).expect(200);
    expect(slugResponse.body.data.machine.id).toBe(machine.id);
  });

  test("updates and deactivates machine as admin", async () => {
    const updateResponse = await request(app)
      .put(`/api/machines/${machine.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        name: "Maquina Teste Atualizada",
        location: "Bloco B",
        status: "MAINTENANCE",
      })
      .expect(200);

    expect(updateResponse.body.data.machine).toMatchObject({
      id: machine.id,
      name: "Maquina Teste Atualizada",
      status: "MAINTENANCE",
    });

    const deleteResponse = await request(app)
      .delete(`/api/machines/${machine.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .expect(200);

    expect(deleteResponse.body.data.machine).toMatchObject({
      id: machine.id,
      is_active: false,
    });

    const reactivateResponse = await request(app)
      .put(`/api/machines/${machine.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        status: "ONLINE",
        is_active: true,
      })
      .expect(200);

    machine = reactivateResponse.body.data.machine;
  });

  test("creates, lists, updates and deactivates slots", async () => {
    const createResponse = await request(app)
      .post(`/api/machines/${machine.id}/slots`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        code: "B1",
        motor_id: 10,
        sensor_column_id: 10,
      })
      .expect(201);

    expect(createResponse.body.data.slot).toMatchObject({
      machine_id: machine.id,
      code: "B1",
      motor_id: 10,
      is_enabled: true,
    });

    const createdSlot = createResponse.body.data.slot;

    const listResponse = await request(app)
      .get(`/api/machines/${machine.id}/slots`)
      .set("Authorization", `Bearer ${admin.token}`)
      .expect(200);
    expect(listResponse.body.data.slots).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: createdSlot.id, code: "B1" })]),
    );

    const updateResponse = await request(app)
      .put(`/api/slots/${createdSlot.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        code: "B2",
        motor_id: 11,
        sensor_column_id: 12,
      })
      .expect(200);
    expect(updateResponse.body.data.slot).toMatchObject({ id: createdSlot.id, code: "B2" });

    const deleteResponse = await request(app)
      .delete(`/api/slots/${createdSlot.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .expect(200);
    expect(deleteResponse.body.data.slot).toMatchObject({
      id: createdSlot.id,
      is_enabled: false,
    });
  });

  test("creates, lists, gets, updates and adjusts inventory", async () => {
    const createResponse = await request(app)
      .post("/api/inventory")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        machine_id: machine.id,
        slot_id: slot.id,
        product_id: product.id,
        quantity_available: 8,
        quantity_reserved: 2,
        min_quantity_alert: 1,
      })
      .expect(201);

    expect(createResponse.body.data.inventory).toMatchObject({
      machine_id: machine.id,
      slot_id: slot.id,
      product_id: product.id,
      quantity_available: 8,
      quantity_reserved: 2,
      available_for_sale: 6,
    });

    inventory = createResponse.body.data.inventory;

    const listResponse = await request(app)
      .get("/api/inventory")
      .set("Authorization", `Bearer ${admin.token}`)
      .expect(200);
    expect(listResponse.body.data.inventory).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: inventory.id })]),
    );

    const machineInventoryResponse = await request(app)
      .get(`/api/machines/${machine.id}/inventory`)
      .set("Authorization", `Bearer ${admin.token}`)
      .expect(200);
    expect(machineInventoryResponse.body.data.inventory).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: inventory.id })]),
    );

    const getResponse = await request(app)
      .get(`/api/inventory/${inventory.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .expect(200);
    expect(getResponse.body.data.inventory.available_for_sale).toBe(6);

    const updateResponse = await request(app)
      .put(`/api/inventory/${inventory.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        quantity_available: 10,
        quantity_reserved: 3,
        min_quantity_alert: 2,
      })
      .expect(200);
    expect(updateResponse.body.data.inventory.available_for_sale).toBe(7);

    const adjustResponse = await request(app)
      .post(`/api/inventory/${inventory.id}/adjust`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        quantity_available_delta: 5,
        reason: "Reposicao de teste",
      })
      .expect(200);
    expect(adjustResponse.body.data.inventory).toMatchObject({
      id: inventory.id,
      quantity_available: 15,
      quantity_reserved: 3,
      available_for_sale: 12,
    });
  });

  test("rejects negative inventory quantities and invalid relations", async () => {
    const negativeResponse = await request(app)
      .post("/api/inventory")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        machine_id: machine.id,
        slot_id: slot.id,
        product_id: product.id,
        quantity_available: -1,
      })
      .expect(400);
    expect(negativeResponse.body.error.code).toBe("VALIDATION_ERROR");

    const invalidProductResponse = await request(app)
      .post("/api/inventory")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        machine_id: machine.id,
        slot_id: slot.id,
        product_id: 999999999,
        quantity_available: 1,
      })
      .expect(404);
    expect(invalidProductResponse.body.error.code).toBe("PRODUCT_NOT_FOUND");
  });

  test("gets machine catalog by slug with sale availability", async () => {
    const response = await request(app)
      .get(`/api/machines/slug/${machine.slug}/catalog`)
      .expect(200);

    expect(response.body.data.machine).toMatchObject({
      id: machine.id,
      slug: machine.slug,
      can_sell: true,
    });
    expect(response.body.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          inventory_id: inventory.id,
          slot_id: slot.id,
          product_id: product.id,
          available_for_sale: 12,
        }),
      ]),
    );
  });

  test("records MongoDB logs for machine, slot and inventory changes", async () => {
    const createLogs = await findModuleLogs("CREATE");
    const updateLogs = await findModuleLogs("UPDATE");
    const deleteLogs = await findModuleLogs("DELETE");

    expect(createLogs.some((log) => log.table === "machines")).toBe(true);
    expect(createLogs.some((log) => log.table === "slots")).toBe(true);
    expect(createLogs.some((log) => log.table === "inventory")).toBe(true);
    expect(updateLogs.some((log) => log.table === "machines")).toBe(true);
    expect(updateLogs.some((log) => log.table === "slots")).toBe(true);
    expect(updateLogs.some((log) => log.table === "inventory")).toBe(true);
    expect(deleteLogs.some((log) => log.table === "machines")).toBe(true);
    expect(deleteLogs.some((log) => log.table === "slots")).toBe(true);
  });
});
