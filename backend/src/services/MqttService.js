const env = require("../config/env");
const { getMqttClient } = require("../config/mqtt");
const { buildEsp32DispensePayload } = require("../utils/esp32Command");

function createMqttError(message, code = "MQTT_PUBLISH_FAILED") {
  const error = new Error(message);
  error.code = code;
  return error;
}

class MqttService {
  constructor(client = null, machineEventService = null) {
    this.client = client;
    this.machineEventService = machineEventService;
    this.started = false;
  }

  getClient() {
    if (this.client) {
      return this.client;
    }

    if (env.isTest) {
      return null;
    }

    this.client = getMqttClient();
    return this.client;
  }

  async start(machineEventService = this.machineEventService) {
    this.machineEventService = machineEventService;
    const client = this.getClient();

    if (!client || this.started) {
      return false;
    }

    this.started = true;
    client.on("connect", () => {
      console.info("[mqtt] connected");
      client.subscribe("vending/+/events", () => {});
      client.subscribe("vending/+/status", () => {});
    });

    client.on("error", (error) => {
      console.error("[mqtt] error", error.message);
    });

    client.on("offline", () => {
      console.warn("[mqtt] offline");
    });

    client.on("reconnect", () => {
      console.info("[mqtt] reconnecting");
    });

    client.on("close", () => {
      console.warn("[mqtt] connection closed");
    });

    client.on("message", (topic, message) => {
      if (!this.machineEventService) return;

      this.machineEventService
        .processMqttMessage(topic, message)
        .catch(() => {});
    });

    return true;
  }

  async publish(topic, payload) {
    const client = this.getClient();
    const body = JSON.stringify(payload);

    if (!client) {
      return { topic, payload, skipped: true, reason: "MQTT client unavailable" };
    }

    const options = { qos: 1, retain: false };

    if (client.connected === false) {
      throw createMqttError("MQTT client is not connected", "MQTT_NOT_CONNECTED");
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(createMqttError(`MQTT publish timeout for topic ${topic}`, "MQTT_PUBLISH_TIMEOUT"));
      }, 5000);

      client.publish(topic, body, options, (error) => {
        clearTimeout(timeout);
        if (error) {
          reject(error);
          return;
        }

        resolve({ topic, payload, skipped: false, queued: false });
      });
    });
  }

  async publishDispenseCommand(command) {
    const topic = command.mqtt_topic || `vending/${command.machine_id}/actions`;
    const payload = buildEsp32DispensePayload(command);

    return this.publish(topic, payload);
  }
}

module.exports = MqttService;
