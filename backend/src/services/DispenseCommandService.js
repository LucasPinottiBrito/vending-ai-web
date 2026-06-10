const IService = require("../interfaces/IService");
const DispenseCommandDAO = require("../dao/DispenseCommandDAO");
const LogService = require("./LogService");
const MqttService = require("./MqttService");
const ApiError = require("../utils/ApiError");
const { normalizeDispenseCommand } = require("../models/DispenseCommandModel");

class DispenseCommandService extends IService {
  constructor(
    dispenseCommandDAO = new DispenseCommandDAO(),
    mqttService = new MqttService(),
    logService = new LogService(),
  ) {
    super();
    this.dispenseCommandDAO = dispenseCommandDAO;
    this.mqttService = mqttService;
    this.logService = logService;
  }

  async create() {
    throw new ApiError(501, "Dispense command creation is handled by checkout", "NOT_IMPLEMENTED");
  }

  async getById(id) {
    const command = normalizeDispenseCommand(await this.dispenseCommandDAO.findById(id));
    if (!command) {
      throw new ApiError(404, "Dispense command not found", "DISPENSE_COMMAND_NOT_FOUND");
    }

    return command;
  }

  async list(filters = {}) {
    return (await this.dispenseCommandDAO.findAll(filters)).map(normalizeDispenseCommand);
  }

  async update(id, data, context = {}) {
    const before = await this.getById(id);
    const after = normalizeDispenseCommand(await this.dispenseCommandDAO.update(id, data));
    await this.logCrud("UPDATE", {
      context,
      table: "dispense_commands",
      recordId: after.id,
      before,
      after,
    });
    return after;
  }

  async delete() {
    throw new ApiError(501, "Dispense command delete is not implemented", "NOT_IMPLEMENTED");
  }

  async publishPendingCommand(commandOrId, context = {}) {
    const command =
      typeof commandOrId === "object"
        ? normalizeDispenseCommand(commandOrId)
        : await this.getById(commandOrId);

    if (!command) {
      throw new ApiError(404, "Dispense command not found", "DISPENSE_COMMAND_NOT_FOUND");
    }

    if (command.status !== "PENDING") {
      return command;
    }

    await this.mqttService.publishDispenseCommand(command);

    const after = normalizeDispenseCommand(
      await this.dispenseCommandDAO.update(command.id, {
        status: "PUBLISHED",
        published_at: new Date(),
      }),
    );

    await this.logCrud("UPDATE", {
      context,
      table: "dispense_commands",
      recordId: after.id,
      before: command,
      after,
      details: { published_to_mqtt: true },
    });

    return after;
  }

  async logCrud(eventType, { context, table, recordId, before = null, after = null, details = {} }) {
    await this.logService.create({
      event_type: eventType,
      action: `${context.method || null} ${context.endpoint || null}`,
      method: context.method || null,
      endpoint: context.endpoint || null,
      status_code: context.status_code || null,
      response_time_ms: context.response_time_ms || 0,
      ip: context.ip || null,
      user_agent: context.user_agent || null,
      user_id: context.user?.id || null,
      username: context.user?.email || null,
      table,
      record_id: recordId,
      before,
      after,
      details,
    });
  }
}

module.exports = DispenseCommandService;
