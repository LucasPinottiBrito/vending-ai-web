const fs = require("node:fs");
const path = require("node:path");

const request = require("supertest");

const app = require("../src/app");
const env = require("../src/config/env");
const mysql = require("../src/config/mysql");
const mongodb = require("../src/config/mongodb");
const { hashPassword } = require("../src/utils/password");

const runId = Date.now();
const adminEmail = `product.admin.${runId}@example.com`;
const userEmail = `product.user.${runId}@example.com`;
const skuPrefix = `TEST-PROD-${runId}`;

const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

async function createUser({ email, role }) {
  const passwordHash = await hashPassword("StrongPass123");
  const [result] = await mysql.query(
    `INSERT INTO users (name, email, password_hash, role, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [`Product ${role}`, email, passwordHash, role],
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
  const [products] = await mysql.query("SELECT id, image_path FROM products WHERE sku LIKE ?", [
    `${skuPrefix}%`,
  ]);
  const productIds = products.map((product) => product.id);

  if (productIds.length > 0) {
    await mysql.query("DELETE FROM products WHERE id IN (?)", [productIds]);
  }

  for (const product of products) {
    if (product.image_path) {
      const filename = path.basename(product.image_path);
      const fullPath = path.join(env.uploadPath, filename);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
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
      { "after.sku": { $regex: `^${skuPrefix}` } },
      { "before.sku": { $regex: `^${skuPrefix}` } },
      { username: adminEmail },
      { username: userEmail },
    ],
  });
}

async function findProductLogs(eventType) {
  const db = await mongodb.getMongoDb();
  return db
    .collection("logs")
    .find({
      event_type: eventType,
      table: "products",
      $or: [
        { "after.sku": { $regex: `^${skuPrefix}` } },
        { "before.sku": { $regex: `^${skuPrefix}` } },
      ],
    })
    .toArray();
}

describe("product CRUD routes", () => {
  let admin;
  let user;
  let createdProduct;

  beforeAll(async () => {
    await cleanup();
    admin = await createUser({ email: adminEmail, role: "ADMIN" });
    user = await createUser({ email: userEmail, role: "USER" });
  });

  afterAll(async () => {
    await cleanup();
    await mysql.closePool();
    await mongodb.closeMongoConnection();
  });

  test("creates product as admin", async () => {
    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        sku: `${skuPrefix}-CREATE`,
        name: "Produto Teste Admin",
        description: "Criado por teste automatizado",
        category: "Testes",
        price_cents: 1234,
        is_active: true,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.product).toMatchObject({
      sku: `${skuPrefix}-CREATE`,
      name: "Produto Teste Admin",
      category: "Testes",
      price_cents: 1234,
      is_active: true,
    });

    createdProduct = response.body.data.product;
  });

  test("prevents product creation as common user", async () => {
    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        sku: `${skuPrefix}-DENIED`,
        name: "Produto Negado",
        category: "Testes",
        price_cents: 100,
      })
      .expect(403);

    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  test("rejects negative price", async () => {
    const response = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        sku: `${skuPrefix}-NEGATIVE`,
        name: "Produto Negativo",
        category: "Testes",
        price_cents: -1,
      })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("lists products with category and status filters", async () => {
    const response = await request(app)
      .get("/api/products")
      .set("Authorization", `Bearer ${user.token}`)
      .query({ category: "Testes", status: "active" })
      .expect(200);

    expect(response.body.data.products.some((product) => product.id === createdProduct.id)).toBe(true);
  });

  test("searches product by name", async () => {
    const response = await request(app)
      .get("/api/products")
      .query({ search: "Produto Teste Admin" })
      .expect(200);

    expect(response.body.data.products).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createdProduct.id,
          sku: `${skuPrefix}-CREATE`,
        }),
      ]),
    );
  });

  test("gets product by id as common user", async () => {
    const response = await request(app)
      .get(`/api/products/${createdProduct.id}`)
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);

    expect(response.body.data.product).toMatchObject({
      id: createdProduct.id,
      sku: `${skuPrefix}-CREATE`,
    });
  });

  test("updates product as admin", async () => {
    const response = await request(app)
      .put(`/api/products/${createdProduct.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        name: "Produto Teste Atualizado",
        description: "Atualizado por teste automatizado",
        category: "Testes Atualizados",
        price_cents: 1500,
        is_active: true,
      })
      .expect(200);

    expect(response.body.data.product).toMatchObject({
      id: createdProduct.id,
      name: "Produto Teste Atualizado",
      price_cents: 1500,
    });
  });

  test("uploads product image as admin and serves it statically", async () => {
    const response = await request(app)
      .post(`/api/products/${createdProduct.id}/image`)
      .set("Authorization", `Bearer ${admin.token}`)
      .attach("image", tinyPng, {
        filename: "product-test.png",
        contentType: "image/png",
      })
      .expect(200);

    expect(response.body.data.product.image_path).toMatch(/^\/uploads\/products\/.+\.png$/);

    await request(app).get(response.body.data.product.image_path).expect(200);
  });

  test("deletes product by deactivating it as admin", async () => {
    const response = await request(app)
      .delete(`/api/products/${createdProduct.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .expect(200);

    expect(response.body.data.product).toMatchObject({
      id: createdProduct.id,
      is_active: false,
    });
  });

  test("records MongoDB logs for create, update and delete", async () => {
    const createLogs = await findProductLogs("CREATE");
    const updateLogs = await findProductLogs("UPDATE");
    const deleteLogs = await findProductLogs("DELETE");

    expect(createLogs.length).toBeGreaterThanOrEqual(1);
    expect(updateLogs.length).toBeGreaterThanOrEqual(1);
    expect(deleteLogs.length).toBeGreaterThanOrEqual(1);
  });
});
