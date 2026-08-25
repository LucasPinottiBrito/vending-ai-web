const app = require("./app");
const env = require("./config/env");
const mysql = require("./config/mysql");
const mongodb = require("./config/mongodb");
const MqttService = require("./services/MqttService");
const MachineEventService = require("./services/MachineEventService");

async function bootstrap() {
  await mysql.testConnection();
  await mongodb.testConnection();
  await mongodb.ensureLogIndexes();

  const mqttService = new MqttService();
  const machineEventService = new MachineEventService();
  await mqttService.start(machineEventService);

  const offlineInterval = setInterval(() => {
    machineEventService.markOfflineMachines().catch((error) => {
      console.error("[machine-status] failed to mark stale machines offline", error.message);
    });
  }, 15 * 1000);
  offlineInterval.unref?.();

  app.listen(env.port, "0.0.0.0", () => {
    console.log(`Backend listening on port ${env.port}`);
  });
}

bootstrap().catch(async (error) => {
  console.error("Failed to start backend", error);
  await mysql.closePool().catch(() => {});
  await mongodb.closeMongoConnection().catch(() => {});
  process.exit(1);
});
