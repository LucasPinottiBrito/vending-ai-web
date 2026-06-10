const mysql = require("../src/config/mysql");
const mongodb = require("../src/config/mongodb");

describe("database connections", () => {
  afterAll(async () => {
    await mysql.closePool();
    await mongodb.closeMongoConnection();
  });

  test("MySQL connection executes SELECT 1", async () => {
    const [rows] = await mysql.query("SELECT 1 AS ok");

    expect(rows).toEqual([{ ok: 1 }]);
  });

  test("MongoDB connection executes ping", async () => {
    const db = await mongodb.getMongoDb();
    const result = await db.admin().ping();

    expect(result).toMatchObject({ ok: 1 });
  });
});
