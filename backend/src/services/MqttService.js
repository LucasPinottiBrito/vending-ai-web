const env = require("../config/env");
const { getMqttClient } = require("../config/mqtt");

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

    const options = { qos: 1 };

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
    const storedPayload = command.payload_json || {};
    const payload = {
      type: "DISPENSE",
      command_id: command.id,
      sale_id: command.sale_id,
      machine_id: command.machine_id,
      product_id: command.product_id,
      slot_id: command.slot_id,
      slot_code: command.slot_code || storedPayload.slot_code || null,
      motor_id: command.motor_id,
      sensor_column_id: command.sensor_column_id,
      quantity: storedPayload.quantity || command.quantity || 1,
      attempts_allowed: command.attempts_allowed || storedPayload.attempts_allowed || 2,
      timeout_ms_per_attempt: storedPayload.timeout_ms_per_attempt || 10000,
    };

    return this.publish(topic, payload);
  }
}

module.exports = MqttService;
