const { MongoClient } = require("mongodb");

const env = require("./env");

let client;
let db;

function getDatabaseNameFromUri(uri) {
  const parsed = new URL(uri);
  return parsed.pathname.replace("/", "") || "vending_logs";
}

async function getMongoClient() {
  if (!client) {
    client = new MongoClient(env.mongoUri);
    await client.connect();
  }

  return client;
}

async function getMongoDb() {
  if (!db) {
    const connectedClient = await getMongoClient();
    db = connectedClient.db(getDatabaseNameFromUri(env.mongoUri));
  }

  return db;
}

async function testConnection() {
  const database = await getMongoDb();
  const result = await database.admin().ping();
  return result.ok === 1;
}

async function ensureLogIndexes() {
  const database = await getMongoDb();
  const logs = database.collection("logs");

  await Promise.all([
    logs.createIndex({ timestamp: -1 }),
    logs.createIndex({ event_type: 1, timestamp: -1 }),
    logs.createIndex({ user_id: 1, timestamp: -1 }),
    logs.createIndex({ endpoint: 1, timestamp: -1 }),
  ]);
}

async function closeMongoConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = {
  getMongoClient,
  getMongoDb,
  testConnection,
  ensureLogIndexes,
  closeMongoConnection,
};
