const PHYSICAL_MACHINE_ID = 1;
const MAX_MQTT_PAYLOAD_BYTES = 1024;
const MAX_SLOT_CODE_LENGTH = 15;
const MAX_ISSUED_AT_LENGTH = 31;

const SUPPORTED_PHYSICAL_PAIRS = new Map([
  [1, 1],
  [2, 2],
]);

function toInteger(value, fieldName) {
  const number = Number(value);
  if (!Number.isInteger(number)) {
    throw new Error(`${fieldName} must be an integer`);
  }
  return number;
}

function clampInteger(value, fallback, min, max) {
  const number = Number(value ?? fallback);
  if (!Number.isInteger(number)) return fallback;
  return Math.min(Math.max(number, min), max);
}

function isPhysicalMachine(machineId) {
  return Number(machineId) === PHYSICAL_MACHINE_ID;
}

function isSupportedPhysicalSlot(slot) {
  if (!isPhysicalMachine(slot.machine_id)) {
    return true;
  }

  const motorId = Number(slot.motor_id);
  const sensorColumnId = Number(slot.sensor_column_id);
  return SUPPORTED_PHYSICAL_PAIRS.get(motorId) === sensorColumnId;
}

function validateSlotCode(slotCode) {
  const normalized = String(slotCode || "").trim().toUpperCase();
  if (!normalized || normalized.length > MAX_SLOT_CODE_LENGTH) {
    throw new Error(`slot_code must be 1 to ${MAX_SLOT_CODE_LENGTH} characters`);
  }

  if (!/^[A-Z0-9_-]+$/.test(normalized)) {
    throw new Error("slot_code contains unsupported characters");
  }

  return normalized;
}

function normalizeIssuedAt(value) {
  const issuedAt = value ? String(value) : new Date().toISOString();
  if (!issuedAt || issuedAt.length > MAX_ISSUED_AT_LENGTH) {
    throw new Error(`issued_at must be at most ${MAX_ISSUED_AT_LENGTH} characters`);
  }
  return issuedAt;
}

function buildEsp32DispensePayload(command) {
  const storedPayload = command.payload_json && typeof command.payload_json === "object"
    ? command.payload_json
    : {};

  if (!isSupportedPhysicalSlot(command)) {
    throw new Error("Slot hardware is not supported by the current ESP32-S3 machine");
  }

  const payload = {
    type: "DISPENSE",
    command_id: toInteger(command.id, "command_id"),
    sale_id: toInteger(command.sale_id, "sale_id"),
    machine_id: toInteger(command.machine_id, "machine_id"),
    product_id: toInteger(command.product_id, "product_id"),
    slot_id: toInteger(command.slot_id, "slot_id"),
    slot_code: validateSlotCode(command.slot_code || storedPayload.slot_code),
    motor_id: toInteger(command.motor_id, "motor_id"),
    sensor_column_id: toInteger(command.sensor_column_id, "sensor_column_id"),
    quantity: 1,
    attempts_allowed: clampInteger(
      command.attempts_allowed ?? storedPayload.attempts_allowed,
      2,
      1,
      3,
    ),
    timeout_ms_per_attempt: clampInteger(storedPayload.timeout_ms_per_attempt, 10000, 1, 30000),
    issued_at: normalizeIssuedAt(storedPayload.issued_at),
  };

  const size = Buffer.byteLength(JSON.stringify(payload), "utf8");
  if (size >= MAX_MQTT_PAYLOAD_BYTES) {
    throw new Error(`MQTT payload must be smaller than ${MAX_MQTT_PAYLOAD_BYTES} bytes`);
  }

  return payload;
}

module.exports = {
  PHYSICAL_MACHINE_ID,
  buildEsp32DispensePayload,
  isSupportedPhysicalSlot,
  validateSlotCode,
};
