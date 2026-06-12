const IService = require("../interfaces/IService");
const mysql = require("../config/mysql");
const MachineDAO = require("../dao/MachineDAO");
const MachineEventDAO = require("../dao/MachineEventDAO");
const DispenseCommandDAO = require("../dao/DispenseCommandDAO");
const SaleDAO = require("../dao/SaleDAO");
const InventoryDAO = require("../dao/InventoryDAO");
const WalletDAO = require("../dao/WalletDAO");
const WalletTransactionDAO = require("../dao/WalletTransactionDAO");
const LogService = require("./LogService");
const ApiError = require("../utils/ApiError");
const { normalizeMachine } = require("../models/MachineModel");
const { normalizeMachineEvent } = require("../models/MachineEventModel");
const { normalizeDispenseCommand } = require("../models/DispenseCommandModel");
const { normalizeSale } = require("../models/SaleModel");
const { normalizeInventory } = require("../models/InventoryModel");
const { normalizeWallet } = require("../models/WalletModel");
const { normalizeWalletTransaction } = require("../models/WalletTransactionModel");

const VALID_EVENTS = new Set([
  "HEARTBEAT",
  "DISPENSE_STARTED",
  "SENSOR_TRIGGERED",
  "DISPENSE_RETRY",
  "DISPENSE_SUCCESS",
  "DISPENSE_FAILED",
  "MOTOR_ERROR",
  "MACHINE_ERROR",
  "INVALID_JSON",
  "UNKNOWN_COMMAND_TYPE",
  "INVALID_COMMAND",
  "MACHINE_BUSY",
  "UNKNOWN_MOTOR_ID",
  "UNKNOWN_SENSOR_COLUMN_ID",
  "UNSUPPORTED_QUANTITY",
  "COMMAND_DUPLICATED",
  "PRODUCT_NOT_DETECTED",
  "INTERNAL_ERROR",
]);

const ESP_REJECTION_EVENTS = new Set([
  "INVALID_JSON",
  "UNKNOWN_COMMAND_TYPE",
  "INVALID_COMMAND",
  "MACHINE_BUSY",
  "UNKNOWN_MOTOR_ID",
  "UNKNOWN_SENSOR_COLUMN_ID",
  "UNSUPPORTED_QUANTITY",
  "COMMAND_DUPLICATED",
  "PRODUCT_NOT_DETECTED",
  "INTERNAL_ERROR",
]);

class MachineEventService extends IService {
  constructor(
    machineEventDAO = new MachineEventDAO(),
    machineDAO = new MachineDAO(),
    dispenseCommandDAO = new DispenseCommandDAO(),
    saleDAO = new SaleDAO(),
    inventoryDAO = new InventoryDAO(),
    walletDAO = new WalletDAO(),
    walletTransactionDAO = new WalletTransactionDAO(),
    logService = new LogService(),
  ) {
    super();
    this.machineEventDAO = machineEventDAO;
    this.machineDAO = machineDAO;
    this.dispenseCommandDAO = dispenseCommandDAO;
    this.saleDAO = saleDAO;
    this.inventoryDAO = inventoryDAO;
    this.walletDAO = walletDAO;
    this.walletTransactionDAO = walletTransactionDAO;
    this.logService = logService;
  }

  async create(data, context = {}) {
    return this.processEvent(data, context);
  }

  async getById(id) {
    const event = normalizeMachineEvent(await this.machineEventDAO.findById(id));
    if (!event) {
      throw new ApiError(404, "Machine event not found", "MACHINE_EVENT_NOT_FOUND");
    }
    return event;
  }

  async list(filters = {}) {
    return (await this.machineEventDAO.findAll(filters)).map(normalizeMachineEvent);
  }

  async update() {
    throw new ApiError(501, "Machine events are immutable", "NOT_IMPLEMENTED");
  }

  async delete() {
    throw new ApiError(501, "Machine event delete is not implemented", "NOT_IMPLEMENTED");
  }

  async processMqttMessage(topic, message) {
    const payload = JSON.parse(Buffer.isBuffer(message) ? message.toString("utf8") : String(message));
    const normalizedPayload = this.normalizeEventPayload(payload);
    const machineId =
      this.parseMachineIdFromTopic(topic) ||
      normalizedPayload.machine_id;
    const eventType =
      normalizedPayload.type ||
      normalizedPayload.event_type ||
      (topic.endsWith("/status") ? "HEARTBEAT" : null);

    return this.processEvent({
      ...normalizedPayload,
      event_type: eventType,
      machine_id: machineId,
      payload,
    });
  }

  async processEvent(data, context = {}) {
    data = this.normalizeEventPayload(data);
    const eventType = data.event_type || data.type;
    if (!VALID_EVENTS.has(eventType)) {
      throw new ApiError(400, "Unsupported machine event type", "UNSUPPORTED_MACHINE_EVENT");
    }

    if (eventType === "HEARTBEAT") {
      return this.processHeartbeat(data, context);
    }

    if (eventType === "DISPENSE_SUCCESS") {
      return this.processDispenseSuccess(data, context);
    }

    if (eventType === "SENSOR_TRIGGERED" && (data.command_id || data.dispense_command_id || data.sale_id)) {
      return this.processDispenseSuccess(data, context);
    }

    if (eventType === "DISPENSE_FAILED") {
      return this.processDispenseFailed(data, context);
    }

    if (ESP_REJECTION_EVENTS.has(eventType)) {
      return this.processEspRejection(data, context);
    }

    return this.processOperationalEvent(data, context);
  }

  async processEspRejection(data, context = {}) {
    const eventType = data.event_type || data.type;
    const commandId = data.command_id || data.dispense_command_id;
    const saleId = data.sale_id;

    if (commandId || saleId) {
      return this.processDispenseFailed(
        {
          ...data,
          event_type: eventType,
          reason: eventType,
          payload: {
            ...(data.payload || data),
            rejection_type: eventType,
            rejection_reason: data.reason || data.payload?.reason || null,
          },
        },
        context,
      );
    }

    return this.processOperationalEvent(data, context);
  }

  async processHeartbeat(data, context = {}) {
    const connection = await mysql.getPool().getConnection();
    try {
      await connection.beginTransaction();
      const machineBefore = normalizeMachine(await this.machineDAO.findById(data.machine_id));
      if (!machineBefore) {
        throw new ApiError(404, "Machine not found", "MACHINE_NOT_FOUND");
      }

      const machineAfter = normalizeMachine(
        await this.machineDAO.updateWithConnection(
          data.machine_id,
          { last_seen_at: new Date(), status: "ONLINE" },
          connection,
        ),
      );
      const event = normalizeMachineEvent(
        await this.machineEventDAO.create(
          {
            machine_id: data.machine_id,
            event_type: "HEARTBEAT",
            payload_json: data.payload || data,
          },
          connection,
        ),
      );
      await connection.commit();

      await this.logCrud("UPDATE", {
        context,
        table: "machines",
        recordId: machineAfter.id,
        before: machineBefore,
        after: machineAfter,
      });
      await this.logCrud("CREATE", {
        context,
        table: "machine_events",
        recordId: event.id,
        after: event,
        details: this.logDetails(data),
      });

      return { event, machine: machineAfter };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  normalizeEventPayload(payload = {}) {
    const normalized = { ...payload };

    const aliases = {
      event_type: ["event_type", "eventType", "type"],
      machine_id: ["machine_id", "machineId"],
      command_id: ["command_id", "commandId"],
      dispense_command_id: ["dispense_command_id", "dispenseCommandId"],
      sale_id: ["sale_id", "saleId"],
      product_id: ["product_id", "productId"],
      slot_id: ["slot_id", "slotId"],
      sensor_column_id: ["sensor_column_id", "sensorColumnId"],
      motor_id: ["motor_id", "motorId"],
    };

    for (const [target, keys] of Object.entries(aliases)) {
      if (normalized[target] !== undefined && normalized[target] !== null) {
        continue;
      }

      const sourceKey = keys.find((key) => payload[key] !== undefined && payload[key] !== null);
      if (sourceKey) {
        normalized[target] = payload[sourceKey];
      }
    }

    return normalized;
  }

  async processOperationalEvent(data, context = {}) {
    const connection = await mysql.getPool().getConnection();
    try {
      await connection.beginTransaction();
      const command = await this.resolveCommand(data, connection);
      const sale = command ? normalizeSale(await this.saleDAO.findByIdForUpdate(command.sale_id, connection)) : null;

      let saleAfter = sale;
      if (data.event_type === "DISPENSE_STARTED" && sale && sale.status === "AUTHORIZED") {
        saleAfter = normalizeSale(await this.saleDAO.update(sale.id, { status: "DISPENSING" }, connection));
      }

      const event = normalizeMachineEvent(
        await this.machineEventDAO.create(
          {
            machine_id: data.machine_id,
            sale_id: data.sale_id || command?.sale_id || null,
            dispense_command_id: data.command_id || command?.id || null,
            event_type: data.event_type,
            payload_json: data.payload || data,
          },
          connection,
        ),
      );
      await connection.commit();

      if (sale && saleAfter && sale.status !== saleAfter.status) {
        await this.logCrud("UPDATE", {
          context,
          table: "sales",
          recordId: saleAfter.id,
          before: sale,
          after: saleAfter,
        });
      }
      await this.logCrud("CREATE", {
        context,
        table: "machine_events",
        recordId: event.id,
        after: event,
        details: this.logDetails(data),
      });

      return { event, sale: saleAfter, command };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async processDispenseSuccess(data, context = {}) {
    const connection = await mysql.getPool().getConnection();
    const logs = [];
    try {
      await connection.beginTransaction();
      const commandBefore = normalizeDispenseCommand(await this.resolveCommand(data, connection, true));
      if (!commandBefore) {
        throw new ApiError(404, "Dispense command not found", "DISPENSE_COMMAND_NOT_FOUND");
      }
      const saleBefore = normalizeSale(await this.saleDAO.findByIdForUpdate(commandBefore.sale_id, connection));
      const inventoryBefore = normalizeInventory(
        await this.inventoryDAO.findForCheckout(
          {
            machine_id: commandBefore.machine_id,
            slot_id: commandBefore.slot_id,
            product_id: commandBefore.product_id,
          },
          connection,
          { forUpdate: true },
        ),
      );

      if (commandBefore.status === "SUCCESS" || saleBefore.status === "DISPENSED") {
        const event = await this.createEventRecord(data, commandBefore, connection);
        await connection.commit();
        await this.logCrud("CREATE", {
          context,
          table: "machine_events",
          recordId: event.id,
          after: event,
          details: this.logDetails(data),
        });
        return { event, command: commandBefore, sale: saleBefore, idempotent: true };
      }

      const inventoryAfter = normalizeInventory(
        await this.inventoryDAO.finalizeReserved(inventoryBefore.id, 1, connection),
      );
      const commandAfter = normalizeDispenseCommand(
        await this.dispenseCommandDAO.update(
          commandBefore.id,
          { status: "SUCCESS", completed_at: new Date() },
          connection,
        ),
      );
      const saleAfter = normalizeSale(
        await this.saleDAO.update(saleBefore.id, { status: "DISPENSED" }, connection),
      );
      const event = await this.createEventRecord(data, commandAfter, connection);

      await connection.commit();

      logs.push(
        { eventType: "UPDATE", table: "inventory", recordId: inventoryAfter.id, before: inventoryBefore, after: inventoryAfter },
        { eventType: "UPDATE", table: "dispense_commands", recordId: commandAfter.id, before: commandBefore, after: commandAfter },
        { eventType: "UPDATE", table: "sales", recordId: saleAfter.id, before: saleBefore, after: saleAfter },
        { eventType: "CREATE", table: "machine_events", recordId: event.id, after: event, details: this.logDetails(data) },
      );
      for (const log of logs) await this.logCrud(log.eventType, { context, ...log });

      return { event, command: commandAfter, sale: saleAfter, inventory: inventoryAfter, idempotent: false };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async processDispenseFailed(data, context = {}) {
    const connection = await mysql.getPool().getConnection();
    const logs = [];
    try {
      await connection.beginTransaction();
      const commandBefore = normalizeDispenseCommand(await this.resolveCommand(data, connection, true));
      if (!commandBefore) {
        throw new ApiError(404, "Dispense command not found", "DISPENSE_COMMAND_NOT_FOUND");
      }
      const saleBefore = normalizeSale(await this.saleDAO.findByIdForUpdate(commandBefore.sale_id, connection));
      const inventoryBefore = normalizeInventory(
        await this.inventoryDAO.findForCheckout(
          {
            machine_id: commandBefore.machine_id,
            slot_id: commandBefore.slot_id,
            product_id: commandBefore.product_id,
          },
          connection,
          { forUpdate: true },
        ),
      );
      const existingRefunds = await this.findRefundTransactions(saleBefore.id, connection);

      if (commandBefore.status === "FAILED" && saleBefore.status === "REFUNDED" && existingRefunds.length > 0) {
        const event = await this.createEventRecord(data, commandBefore, connection);
        await connection.commit();
        await this.logCrud("CREATE", {
          context,
          table: "machine_events",
          recordId: event.id,
          after: event,
          details: this.logDetails(data),
        });
        return { event, command: commandBefore, sale: saleBefore, idempotent: true };
      }

      const inventoryAfter =
        inventoryBefore.quantity_reserved > 0
          ? normalizeInventory(await this.inventoryDAO.releaseReserved(inventoryBefore.id, 1, connection))
          : inventoryBefore;
      const commandAfter = normalizeDispenseCommand(
        await this.dispenseCommandDAO.update(
          commandBefore.id,
          { status: "FAILED", completed_at: new Date(), last_error: data.reason || data.payload?.reason || null },
          connection,
        ),
      );
      const failedSale = normalizeSale(
        await this.saleDAO.update(saleBefore.id, { status: "FAILED", failure_reason: data.reason || "Dispense failed" }, connection),
      );
      const walletBefore = normalizeWallet(await this.walletDAO.findByUserId(saleBefore.user_id, connection, { forUpdate: true }));
      const walletAfter = normalizeWallet(await this.walletDAO.credit(walletBefore.id, saleBefore.total_cents, connection));
      const refund = normalizeWalletTransaction(
        await this.walletTransactionDAO.create(
          {
            wallet_id: walletAfter.id,
            user_id: saleBefore.user_id,
            sale_id: saleBefore.id,
            type: "REFUND",
            amount_cents: saleBefore.total_cents,
            status: "COMPLETED",
            reference_type: "REFUND",
            reference_id: saleBefore.id,
            description: "Refund for failed dispense",
          },
          connection,
        ),
      );
      const saleAfter = normalizeSale(
        await this.saleDAO.update(saleBefore.id, { status: "REFUNDED" }, connection),
      );
      const event = await this.createEventRecord(data, commandAfter, connection);

      await connection.commit();

      logs.push(
        { eventType: "UPDATE", table: "inventory", recordId: inventoryAfter.id, before: inventoryBefore, after: inventoryAfter },
        { eventType: "UPDATE", table: "dispense_commands", recordId: commandAfter.id, before: commandBefore, after: commandAfter },
        { eventType: "UPDATE", table: "sales", recordId: failedSale.id, before: saleBefore, after: failedSale },
        { eventType: "UPDATE", table: "wallets", recordId: walletAfter.id, before: walletBefore, after: walletAfter },
        { eventType: "CREATE", table: "wallet_transactions", recordId: refund.id, after: refund },
        { eventType: "UPDATE", table: "sales", recordId: saleAfter.id, before: failedSale, after: saleAfter },
        { eventType: "CREATE", table: "machine_events", recordId: event.id, after: event, details: this.logDetails(data) },
      );
      for (const log of logs) await this.logCrud(log.eventType, { context, ...log });

      return { event, command: commandAfter, sale: saleAfter, inventory: inventoryAfter, wallet: walletAfter, refund, idempotent: false };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async createEventRecord(data, command, connection) {
    return normalizeMachineEvent(
      await this.machineEventDAO.create(
        {
          machine_id: data.machine_id || command.machine_id,
          sale_id: data.sale_id || command.sale_id,
          dispense_command_id: data.command_id || command.id,
          event_type: data.event_type,
          payload_json: data.payload || data,
        },
        connection,
      ),
    );
  }

  async resolveCommand(data, connection, forUpdate = false) {
    const commandId = data.command_id || data.dispense_command_id;
    if (commandId) {
      return forUpdate
        ? this.dispenseCommandDAO.findByIdForUpdate(commandId, connection)
        : this.dispenseCommandDAO.findById(commandId, connection);
    }

    if (data.sale_id) {
      if (forUpdate) {
        return this.dispenseCommandDAO.findFirstBySaleIdForUpdate(data.sale_id, connection);
      }

      const commands = await this.dispenseCommandDAO.findBySaleId(data.sale_id, connection);
      return commands[0] || null;
    }

    return null;
  }

  async findRefundTransactions(saleId, connection) {
    const [rows] = await connection.query(
      "SELECT id FROM wallet_transactions WHERE sale_id = ? AND type = 'REFUND' LIMIT 1",
      [saleId],
    );
    return rows;
  }

  async markOfflineMachines(thresholdDate = new Date(Date.now() - 70 * 1000)) {
    return this.machineDAO.markOfflineWithoutHeartbeat(thresholdDate);
  }

  parseMachineIdFromTopic(topic) {
    const match = String(topic).match(/^vending\/([^/]+)\/(?:events|status)$/);
    return match ? Number(match[1]) : null;
  }

  logDetails(data) {
    return {
      test_run_id: data.payload?.test_run_id || data.test_run_id || null,
      source: "mqtt",
    };
  }

  async logCrud(eventType, { context = {}, table, recordId, before = null, after = null, details = {} }) {
    await this.logService.create({
      event_type: eventType,
      action: `${context.method || "MQTT"} ${context.endpoint || table}`,
      method: context.method || "MQTT",
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

module.exports = MachineEventService;
