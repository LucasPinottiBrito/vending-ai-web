const mqtt = require("mqtt");

const env = require("./env");

let client;

function buildBrokerUrl() {
  const protocol = env.mqtt.useTls ? "mqtts" : "mqtt";
  return `${protocol}://${env.mqtt.host}:${env.mqtt.port}`;
}

function getMqttClient() {
  if (!client) {
    const options = {};

    if (env.mqtt.username) {
      options.username = env.mqtt.username;
      options.password = env.mqtt.password;
    }

    client = mqtt.connect(buildBrokerUrl(), options);
  }

  return client;
}

function closeMqttClient() {
  if (client) {
    client.end(true);
    client = null;
  }
}

module.exports = {
  buildBrokerUrl,
  getMqttClient,
  closeMqttClient,
};
