const path = require("node:path");

const dotenv = require("dotenv");

dotenv.config();

const isTest = process.env.NODE_ENV === "test";

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isTest,
  port: Number(process.env.PORT || 4000),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  uploadDir: process.env.UPLOAD_DIR || "src/uploads/products",
  publicUploadBaseUrl:
    process.env.PUBLIC_UPLOAD_BASE_URL || "http://localhost:4000/uploads/products",
  mysql: {
    host: process.env.MYSQL_HOST || (isTest ? "127.0.0.1" : "mysql"),
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DATABASE || "vending_machine",
    user: process.env.MYSQL_USER || "vending_user",
    password: process.env.MYSQL_PASSWORD || "vending_pass",
  },
  mongoUri:
    process.env.MONGO_URI ||
    (isTest
      ? "mongodb://127.0.0.1:27017/vending_logs"
      : "mongodb://mongodb:27017/vending_logs"),
  jwt: {
    secret: process.env.JWT_SECRET || "change_this_secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },
  paymentMode: process.env.PAYMENT_MODE || "mock",
  mqtt: {
    host: process.env.MQTT_HOST || "broker.hivemq.com",
    port: Number(process.env.MQTT_PORT || 1883),
    username: process.env.MQTT_USERNAME || "",
    password: process.env.MQTT_PASSWORD || "",
    useTls: String(process.env.MQTT_USE_TLS || "false") === "true",
  },
  whatsappSupportUrl:
    process.env.WHATSAPP_SUPPORT_URL || "https://wa.me/55XXXXXXXXXXX",
};

env.uploadPath = path.resolve(process.cwd(), env.uploadDir);

module.exports = env;
