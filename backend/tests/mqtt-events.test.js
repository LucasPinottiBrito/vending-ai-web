const request = require("supertest");

const app = require("../src/app");
const mysql = require("../src/config/mysql");
const mongodb = require("../src/config/mongodb");
const MqttService = require("../src/services/MqttService");
const MachineEventService = require("../src/services/MachineEventService");
const DispenseCommandService = require("../src/services/DispenseCommandService");

const runId = Date.now();
const adminEmail = "admin@example.com";
const userEmail = `mqtt.user.${runId}@example.com`;
const slugPrefix = `mqtt-machine-${runId}`;
const skuPrefix = `MQTT-PROD-${runId}`;

function createFakeMqttClient() {
  const calls = [];
  return {
    calls,
    publish(topic, payload, options, callback) {
      calls.push({ topic, payload: JSON.parse(payload), options });
      callback(null);
    },
    subscribe(topic, callback) {
      calls.push({ subscribe: topic });
      callback(null);
    },
    on() {},
  };
}

function createDisconnectedFakeMqttClient() {
  const calls = [];
  return {
    connected: false,
    calls,
    publish(topic, payload, options) {
      calls.push({ topic, payload: JSON.parse(payload), options });
    },
    subscribe() {},
    on() {},
  };
}

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
    await mysql.query("DELETE FROM machine_events WHERE sale_id IN (SELECT id FROM sales WHERE user_id IN (?))", [userIds]);
    await mysql.query("DELETE FROM dispense_commands WHERE sale_id IN (SELECT id FROM sales WHERE user_id IN (?))", [userIds]);
    await mysql.query("DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE user_id IN (?))", [userIds]);
    await mysql.query("DELETE FROM wallet_transactions WHERE user_id IN (?)", [userIds]);
    await mysql.query("DELETE FROM sales WHERE user_id IN (?)", [userIds]);
    await mysql.query("DELETE FROM payments WHERE user_id IN (?)", [userIds]);
    await mysql.query("DELETE FROM wallets WHERE user_id IN (?)", [userIds]);
    await mysql.query("DELETE FROM users WHERE id IN (?)", [userIds]);
  }

  if (machineIds.length > 0) {
    await mysql.query("DELETE FROM machine_events WHERE machine_id IN (?)", [machineIds]);
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
      { table: "machine_events", "details.test_run_id": runId },
    ],
  });
}

async function registerUser() {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      name: "MQTT Test User",
      email: userEmail,
      password: "StrongPass123",
    })
    .expect(201);

  return {
    user: response.body.data.user,
    token: response.body.data.token,
  };
}

async function loginAdmin() {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email: adminEmail, password: "Admin@123" })
    .expect(200);

  return response.body.data.token;
}

async function createCheckoutFixture({ suffix, auth, adminToken, amountCents = 1500, priceCents = 800 }) {
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  const product = await request(app)
    .post("/api/products")
    .set(adminHeaders)
    .send({
      sku: `${skuPrefix}-${suffix}`,
      name: `MQTT Product ${suffix}`,
      category: "MQTT",
      price_cents: priceCents,
      is_active: true,
    })
    .expect(201);
  const machine = await request(app)
    .post("/api/machines")
    .set(adminHeaders)
    .send({
      slug: `${slugPrefix}-${suffix.toLowerCase()}`,
      name: `MQTT Machine ${suffix}`,
      location: "Lab MQTT",
      status: "ONLINE",
      slots: [{ code: `M${suffix}`, motor_id: 100 + suffix.length + Math.floor(Math.random() * 1000), sensor_column_id: 200 + suffix.length + Math.floor(Math.random() * 1000) }],
    })
    .expect(201);

  const machineData = machine.body.data.machine;
  const slot = machineData.slots[0];
  const productData = product.body.data.product;

  const inventory = await request(app)
    .post("/api/inventory")
    .set(adminHeaders)
    .send({
      machine_id: machineData.id,
      slot_id: slot.id,
      product_id: productData.id,
      quantity_available: 2,
      quantity_reserved: 0,
      min_quantity_alert: 0,
    })
    .expect(201);

  const userHeaders = { Authorization: `Bearer ${auth.token}` };
  const topup = await request(app)
    .post("/api/wallet/topup/mock")
    .set(userHeaders)
    .send({ amount_cents: amountCents })
    .expect(201);
  await request(app)
    .post(`/api/payments/${topup.body.data.payment.id}/confirm-mock`)
    .set(userHeaders)
    .expect(200);

  const checkout = await request(app)
    .post("/api/sales/checkout")
    .set(userHeaders)
    .set("Idempotency-Key", `mqtt-${runId}-${suffix}`)
    .send({
      machine_id: machineData.id,
      slot_id: slot.id,
      product_id: productData.id,
    })
    .expect(201);

  return {
    product: productData,
    machine: machineData,
    slot,
    inventory: inventory.body.data.inventory,
    checkout: checkout.body.data,
  };
}

async function getCommand(id) {
  const [rows] = await mysql.query("SELECT * FROM dispense_commands WHERE id = ?", [id]);
  return rows[0] || null;
}

async function getSale(id) {
  const [rows] = await mysql.query("SELECT * FROM sales WHERE id = ?", [id]);
  return rows[0] || null;
}

async function getInventory(id) {
  const [rows] = await mysql.query("SELECT * FROM inventory WHERE id = ?", [id]);
  return rows[0] || null;
}

async function getWallet(userId) {
  const [rows] = await mysql.query("SELECT * FROM wallets WHERE user_id = ?", [userId]);
  return rows[0] || null;
}

async function getRefunds(userId, saleId) {
  const [rows] = await mysql.query(
    "SELECT * FROM wallet_transactions WHERE user_id = ? AND sale_id = ? AND type = 'REFUND'",
    [userId, saleId],
  );
  return rows;
}

async function getMachine(id) {
  const [rows] = await mysql.query("SELECT * FROM machines WHERE id = ?", [id]);
  return rows[0] || null;
}

async function getMachineEvents(machineId) {
  const [rows] = await mysql.query("SELECT * FROM machine_events WHERE machine_id = ? ORDER BY id ASC", [
    machineId,
  ]);
  return rows;
}

describe("MQTT publish behavior", () => {
  test("rejects MQTT publish without hanging when client is disconnected", async () => {
    const fakeClient = createDisconnectedFakeMqttClient();
    const mqttService = new MqttService(fakeClient);

    await expect(mqttService.publishDispenseCommand({
      id: 11,
      sale_id: 21,
      machine_id: 31,
      product_id: 41,
      slot_id: 51,
      slot_code: "B1",
      motor_id: 2,
      sensor_column_id: 3,
    })).rejects.toMatchObject({ code: "MQTT_NOT_CONNECTED" });

    expect(fakeClient.calls).toHaveLength(0);
  });

  test("keeps pending dispense command when MQTT publish is unavailable", async () => {
    const commandDAO = {
      update: jest.fn(),
    };
    const mqttService = {
      publishDispenseCommand: jest.fn().mockResolvedValue({
        skipped: true,
        reason: "MQTT client unavailable",
      }),
    };
    const logService = {
      create: jest.fn().mockResolvedValue(null),
    };
    const service = new DispenseCommandService(commandDAO, mqttService, logService);

    const command = {
      id: 12,
      sale_id: 22,
      machine_id: 32,
      product_id: 42,
      slot_id: 52,
      motor_id: 3,
      sensor_column_id: 4,
      status: "PENDING",
      mqtt_topic: "vending/32/actions",
    };

    const result = await service.publishPendingCommand(command, {
      method: "POST",
      endpoint: "/api/sales/checkout",
    });

    expect(result).toMatchObject({ id: 12, status: "PENDING" });
    expect(commandDAO.update).not.toHaveBeenCalled();
    expect(logService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: "ERROR",
        table: "dispense_commands",
        record_id: 12,
        details: expect.objectContaining({
          published_to_mqtt: false,
          reason: "MQTT client unavailable",
        }),
      }),
    );
  });

  test("marks dispense command as published after confirmed MQTT publish", async () => {
    const publishedAt = new Date("2026-06-11T12:00:00.000Z");
    jest.useFakeTimers().setSystemTime(publishedAt);
    try {
      const commandDAO = {
        update: jest.fn().mockResolvedValue({
          id: 13,
          sale_id: 23,
          machine_id: 33,
          product_id: 43,
          slot_id: 53,
          motor_id: 5,
          sensor_column_id: 6,
          status: "PUBLISHED",
          published_at: publishedAt,
        }),
      };
      const mqttService = {
        publishDispenseCommand: jest.fn().mockResolvedValue({
          skipped: false,
          queued: false,
        }),
      };
      const logService = {
        create: jest.fn().mockResolvedValue(null),
      };
      const service = new DispenseCommandService(commandDAO, mqttService, logService);

      const result = await service.publishPendingCommand({
        id: 13,
        sale_id: 23,
        machine_id: 33,
        product_id: 43,
        slot_id: 53,
        motor_id: 5,
        sensor_column_id: 6,
        status: "PENDING",
      });

      expect(result).toMatchObject({ id: 13, status: "PUBLISHED" });
      expect(commandDAO.update).toHaveBeenCalledWith(13, {
        status: "PUBLISHED",
        published_at: publishedAt,
      });
      expect(logService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: "UPDATE",
          table: "dispense_commands",
          record_id: 13,
          details: { published_to_mqtt: true },
        }),
      );
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("MQTT integration and machine events", () => {
  let auth;
  let adminToken;
  let eventService;

  beforeAll(async () => {
    await cleanup();
    auth = await registerUser();
    adminToken = await loginAdmin();
    eventService = new MachineEventService();
  });

  afterAll(async () => {
    await cleanup();
    await mysql.closePool();
    await mongodb.closeMongoConnection();
  });

  test("publishes dispense command payload using mocked MQTT client", async () => {
    const fakeClient = createFakeMqttClient();
    const mqttService = new MqttService(fakeClient);

    await mqttService.publishDispenseCommand({
      id: 10,
      sale_id: 20,
      machine_id: 30,
      product_id: 40,
      slot_id: 50,
      slot_code: "A1",
      motor_id: 1,
      sensor_column_id: 2,
      quantity: 1,
      attempts_allowed: 2,
      timeout_ms_per_attempt: 10000,
      mqtt_topic: "vending/30/actions",
    });

    expect(fakeClient.calls).toHaveLength(1);
    expect(fakeClient.calls[0].topic).toBe("vending/30/actions");
    expect(fakeClient.calls[0].payload).toMatchObject({
      type: "DISPENSE",
      command_id: 10,
      sale_id: 20,
      machine_id: 30,
      product_id: 40,
      slot_id: 50,
      slot_code: "A1",
      motor_id: 1,
      sensor_column_id: 2,
      quantity: 1,
      attempts_allowed: 2,
      timeout_ms_per_attempt: 10000,
    });
  });

  test("processes HEARTBEAT and updates machine last_seen_at", async () => {
    const fixture = await createCheckoutFixture({ suffix: "HEART", auth, adminToken });

    const result = await eventService.processEvent({
      event_type: "HEARTBEAT",
      machine_id: fixture.machine.id,
      payload: { test_run_id: runId },
    });

    const machine = await getMachine(fixture.machine.id);
    const events = await getMachineEvents(fixture.machine.id);

    expect(result.event.event_type).toBe("HEARTBEAT");
    expect(machine.status).toBe("ONLINE");
    expect(machine.last_seen_at).toBeTruthy();
    expect(events.some((event) => event.event_type === "HEARTBEAT")).toBe(true);
  });

  test("processes DISPENSE_STARTED and moves sale to DISPENSING", async () => {
    const fixture = await createCheckoutFixture({ suffix: "START", auth, adminToken });

    await eventService.processEvent({
      event_type: "DISPENSE_STARTED",
      machine_id: fixture.machine.id,
      command_id: fixture.checkout.dispense_command.id,
      sale_id: fixture.checkout.sale.id,
      payload: { test_run_id: runId },
    });

    const sale = await getSale(fixture.checkout.sale.id);
    const command = await getCommand(fixture.checkout.dispense_command.id);

    expect(sale.status).toBe("DISPENSING");
    expect(command.status).toBe("PENDING");
  });

  test("processes DISPENSE_SUCCESS idempotently", async () => {
    const fixture = await createCheckoutFixture({ suffix: "SUCCESS", auth, adminToken });

    await eventService.processEvent({
      event_type: "DISPENSE_SUCCESS",
      machine_id: fixture.machine.id,
      command_id: fixture.checkout.dispense_command.id,
      sale_id: fixture.checkout.sale.id,
      payload: { test_run_id: runId },
    });
    await eventService.processEvent({
      event_type: "DISPENSE_SUCCESS",
      machine_id: fixture.machine.id,
      command_id: fixture.checkout.dispense_command.id,
      sale_id: fixture.checkout.sale.id,
      payload: { test_run_id: runId, duplicate: true },
    });

    const sale = await getSale(fixture.checkout.sale.id);
    const command = await getCommand(fixture.checkout.dispense_command.id);
    const inventory = await getInventory(fixture.inventory.id);

    expect(sale.status).toBe("DISPENSED");
    expect(command.status).toBe("SUCCESS");
    expect(inventory.quantity_available).toBe(1);
    expect(inventory.quantity_reserved).toBe(0);
  });

  test("processes DISPENSE_FAILED idempotently and refunds only once", async () => {
    const fixture = await createCheckoutFixture({ suffix: "FAIL", auth, adminToken });

    await eventService.processEvent({
      event_type: "DISPENSE_FAILED",
      machine_id: fixture.machine.id,
      command_id: fixture.checkout.dispense_command.id,
      sale_id: fixture.checkout.sale.id,
      payload: { test_run_id: runId, reason: "simulated failure" },
    });
    await eventService.processEvent({
      event_type: "DISPENSE_FAILED",
      machine_id: fixture.machine.id,
      command_id: fixture.checkout.dispense_command.id,
      sale_id: fixture.checkout.sale.id,
      payload: { test_run_id: runId, duplicate: true },
    });

    const sale = await getSale(fixture.checkout.sale.id);
    const command = await getCommand(fixture.checkout.dispense_command.id);
    const inventory = await getInventory(fixture.inventory.id);
    const wallet = await getWallet(auth.user.id);
    const refunds = await getRefunds(auth.user.id, fixture.checkout.sale.id);

    expect(sale.status).toBe("REFUNDED");
    expect(command.status).toBe("FAILED");
    expect(inventory.quantity_available).toBe(2);
    expect(inventory.quantity_reserved).toBe(0);
    expect(wallet.balance_cents).toBeGreaterThanOrEqual(700);
    expect(refunds).toHaveLength(1);
    expect(refunds[0].amount_cents).toBe(800);
  });
});
