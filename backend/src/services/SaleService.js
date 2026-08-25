const crypto = require("node:crypto");

const IService = require("../interfaces/IService");
const mysql = require("../config/mysql");
const SaleDAO = require("../dao/SaleDAO");
const SaleItemDAO = require("../dao/SaleItemDAO");
const DispenseCommandDAO = require("../dao/DispenseCommandDAO");
const InventoryDAO = require("../dao/InventoryDAO");
const WalletDAO = require("../dao/WalletDAO");
const WalletTransactionDAO = require("../dao/WalletTransactionDAO");
const LogService = require("./LogService");
const DispenseCommandService = require("./DispenseCommandService");
const ApiError = require("../utils/ApiError");
const { normalizeSale } = require("../models/SaleModel");
const { normalizeSaleItem } = require("../models/SaleItemModel");
const { normalizeDispenseCommand } = require("../models/DispenseCommandModel");
const { normalizeInventory } = require("../models/InventoryModel");
const { normalizeWallet } = require("../models/WalletModel");
const { normalizeWalletTransaction } = require("../models/WalletTransactionModel");
const { isHeartbeatFresh } = require("../models/MachineModel");
const { isSupportedPhysicalSlot, validateSlotCode } = require("../utils/esp32Command");

class SaleService extends IService {
  constructor(
    saleDAO = new SaleDAO(),
    saleItemDAO = new SaleItemDAO(),
    dispenseCommandDAO = new DispenseCommandDAO(),
    inventoryDAO = new InventoryDAO(),
    walletDAO = new WalletDAO(),
    walletTransactionDAO = new WalletTransactionDAO(),
    logService = new LogService(),
    dispenseCommandService = new DispenseCommandService(),
  ) {
    super();
    this.saleDAO = saleDAO;
    this.saleItemDAO = saleItemDAO;
    this.dispenseCommandDAO = dispenseCommandDAO;
    this.inventoryDAO = inventoryDAO;
    this.walletDAO = walletDAO;
    this.walletTransactionDAO = walletTransactionDAO;
    this.logService = logService;
    this.dispenseCommandService = dispenseCommandService;
  }

  async create(data, context = {}) {
    return this.checkout(data, context);
  }

  async getById(id, context = {}) {
    let details = await this.getSaleDetails(id);
    if (!details.sale) {
      throw new ApiError(404, "Sale not found", "SALE_NOT_FOUND");
    }

    this.assertCanAccessSale(details.sale, context);

    const expired = await this.expireStaleDispenseForSale(id, context);
    if (expired) {
      details = await this.getSaleDetails(id);
    }

    return details;
  }

  async list(filters = {}, context = {}) {
    const user = context.user;
    if (!user) {
      throw new ApiError(401, "Authentication is required", "AUTH_REQUIRED");
    }

    const saleFilters = {
      ...filters,
      user_id: user.role === "ADMIN" && filters.user_id ? filters.user_id : user.id,
    };

    return (await this.saleDAO.findAll(saleFilters)).map(normalizeSale);
  }

  async update() {
    throw new ApiError(501, "Sale update is not implemented", "NOT_IMPLEMENTED");
  }

  async delete() {
    throw new ApiError(501, "Sale delete is not implemented", "NOT_IMPLEMENTED");
  }

  async checkout(data, context = {}) {
    const user = context.user;
    if (!user) {
      throw new ApiError(401, "Authentication is required", "AUTH_REQUIRED");
    }

    const commandUuid = this.buildCommandUuid(user.id, context.idempotency_key);
    if (context.idempotency_key) {
      const existing = await this.dispenseCommandDAO.findByCommandUuid(commandUuid);
      if (existing) {
        const existingDetails = await this.getSaleDetails(existing.sale_id);
        this.assertCanAccessSale(existingDetails.sale, context);
        return {
          ...existingDetails,
          idempotent: true,
        };
      }
    }

    const connection = await mysql.getPool().getConnection();
    const logs = [];

    try {
      await connection.beginTransaction();

      const inventoryBeforeRaw = await this.inventoryDAO.findForCheckout(
        {
          machine_id: data.machine_id,
          slot_id: data.slot_id,
          product_id: data.product_id,
        },
        connection,
        { forUpdate: true },
      );

      if (!inventoryBeforeRaw) {
        throw new ApiError(404, "Inventory not found for selected machine, slot and product", "INVENTORY_NOT_FOUND");
      }

      this.validateCheckoutTarget(inventoryBeforeRaw);

      const totalCents = Number(inventoryBeforeRaw.price_cents);
      const availableForSale =
        Number(inventoryBeforeRaw.quantity_available) - Number(inventoryBeforeRaw.quantity_reserved);

      if (availableForSale < 1) {
        throw new ApiError(409, "Product is out of stock", "OUT_OF_STOCK");
      }

      const walletBefore = normalizeWallet(
        await this.walletDAO.findByUserId(user.id, connection, { forUpdate: true }),
      );
      if (!walletBefore) {
        throw new ApiError(404, "Wallet not found", "WALLET_NOT_FOUND");
      }

      if (walletBefore.balance_cents < totalCents) {
        throw new ApiError(402, "Insufficient wallet balance", "INSUFFICIENT_BALANCE");
      }

      const walletAfter = normalizeWallet(await this.walletDAO.debit(walletBefore.id, totalCents, connection));
      if (!walletAfter) {
        throw new ApiError(402, "Insufficient wallet balance", "INSUFFICIENT_BALANCE");
      }

      const inventoryBefore = normalizeInventory(inventoryBeforeRaw);
      const inventoryAfter = normalizeInventory(
        await this.inventoryDAO.reserve(inventoryBefore.id, 1, connection),
      );
      if (!inventoryAfter) {
        throw new ApiError(409, "Product is out of stock", "OUT_OF_STOCK");
      }

      const sale = normalizeSale(
        await this.saleDAO.create(
          {
            user_id: user.id,
            machine_id: inventoryBefore.machine_id,
            status: "AUTHORIZED",
            payment_method: "WALLET",
            total_cents: totalCents,
          },
          connection,
        ),
      );

      const walletTransaction = normalizeWalletTransaction(
        await this.walletTransactionDAO.create(
          {
            wallet_id: walletAfter.id,
            user_id: user.id,
            sale_id: sale.id,
            type: "DEBIT",
            amount_cents: totalCents,
            status: "COMPLETED",
            reference_type: "SALE",
            reference_id: sale.id,
            description: "Wallet checkout",
          },
          connection,
        ),
      );

      const saleItem = normalizeSaleItem(
        await this.saleItemDAO.create(
          {
            sale_id: sale.id,
            product_id: inventoryBefore.product_id,
            slot_id: inventoryBefore.slot_id,
            quantity: 1,
            unit_price_cents: totalCents,
            total_cents: totalCents,
          },
          connection,
        ),
      );

      const dispenseCommand = normalizeDispenseCommand(
        await this.dispenseCommandDAO.create(
          {
            command_uuid: commandUuid,
            sale_id: sale.id,
            machine_id: inventoryBefore.machine_id,
            product_id: inventoryBefore.product_id,
            slot_id: inventoryBefore.slot_id,
            motor_id: inventoryBefore.motor_id,
            sensor_column_id: inventoryBefore.sensor_column_id,
            status: "PENDING",
            mqtt_topic: `vending/${inventoryBefore.machine_id}/actions`,
            payload_json: this.buildDispensePayload({
              commandUuid,
              sale,
              inventory: inventoryBefore,
            }),
          },
          connection,
        ),
      );

      await connection.commit();

      logs.push(
        { eventType: "UPDATE", table: "wallets", recordId: walletAfter.id, before: walletBefore, after: walletAfter },
        {
          eventType: "UPDATE",
          table: "inventory",
          recordId: inventoryAfter.id,
          before: inventoryBefore,
          after: inventoryAfter,
        },
        { eventType: "CREATE", table: "sales", recordId: sale.id, after: sale },
        {
          eventType: "CREATE",
          table: "wallet_transactions",
          recordId: walletTransaction.id,
          after: walletTransaction,
        },
        { eventType: "CREATE", table: "sale_items", recordId: saleItem.id, after: saleItem },
        {
          eventType: "CREATE",
          table: "dispense_commands",
          recordId: dispenseCommand.id,
          after: dispenseCommand,
        },
      );

      for (const log of logs) {
        await this.logCrud(log.eventType, { context, ...log });
      }

      const publishedCommand = await this.dispenseCommandService.publishPendingCommand(
        dispenseCommand,
        context,
      );

      return {
        sale,
        sale_item: saleItem,
        wallet: walletAfter,
        wallet_transaction: walletTransaction,
        inventory: inventoryAfter,
        dispense_command: publishedCommand,
        idempotent: false,
      };
    } catch (error) {
      await connection.rollback();

      if (error && error.code === "ER_DUP_ENTRY" && context.idempotency_key) {
        const existing = await this.dispenseCommandDAO.findByCommandUuid(commandUuid);
        if (existing) {
          return {
            ...(await this.getSaleDetails(existing.sale_id)),
            idempotent: true,
          };
        }
      }

      throw error;
    } finally {
      connection.release();
    }
  }

  async getSaleDetails(saleId, connection = mysql) {
    const sale = normalizeSale(await this.saleDAO.findById(saleId, connection));
    if (!sale) {
      return { sale: null, items: [], dispense_commands: [] };
    }

    const items = (await this.saleItemDAO.findBySaleId(sale.id, connection)).map(normalizeSaleItem);
    const dispenseCommands = (await this.dispenseCommandDAO.findBySaleId(sale.id, connection)).map(
      normalizeDispenseCommand,
    );
    const transactions = (await this.walletTransactionDAO.findBySaleId(sale.id, connection)).map(
      normalizeWalletTransaction,
    );
    const wallet = normalizeWallet(await this.walletDAO.findByUserId(sale.user_id, connection));

    return {
      sale,
      items,
      dispense_commands: dispenseCommands,
      wallet_transactions: transactions,
      wallet,
      sale_item: items[0] || null,
      dispense_command: dispenseCommands[0] || null,
      wallet_transaction: transactions[0] || null,
    };
  }

  validateCheckoutTarget(inventory) {
    if (
      !inventory.machine_is_active ||
      inventory.machine_status !== "ONLINE" ||
      !isHeartbeatFresh(inventory.machine_last_seen_at)
    ) {
      throw new ApiError(409, "Machine is not available for purchases", "MACHINE_NOT_AVAILABLE");
    }

    if (!inventory.slot_is_enabled) {
      throw new ApiError(409, "Slot is disabled", "SLOT_NOT_AVAILABLE");
    }

    if (!inventory.product_is_active) {
      throw new ApiError(409, "Product is inactive", "PRODUCT_NOT_AVAILABLE");
    }

    if (!isSupportedPhysicalSlot(inventory)) {
      throw new ApiError(
        409,
        "Slot hardware is not supported by the current ESP32-S3 machine",
        "SLOT_HARDWARE_NOT_SUPPORTED",
      );
    }

    try {
      validateSlotCode(inventory.slot_code);
    } catch (error) {
      throw new ApiError(409, error.message, "SLOT_HARDWARE_NOT_SUPPORTED");
    }
  }

  assertCanAccessSale(sale, context = {}) {
    const user = context.user;
    if (!user) {
      throw new ApiError(401, "Authentication is required", "AUTH_REQUIRED");
    }

    if (user.role !== "ADMIN" && Number(sale.user_id) !== Number(user.id)) {
      throw new ApiError(403, "Sale access denied", "FORBIDDEN");
    }
  }

  buildCommandUuid(userId, idempotencyKey) {
    if (!idempotencyKey) {
      return crypto.randomUUID();
    }

    const hash = crypto
      .createHash("sha256")
      .update(`${userId}:${idempotencyKey}`)
      .digest("hex");

    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
  }

  buildDispensePayload({ commandUuid, sale, inventory }) {
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + 60 * 1000);

    return {
      type: "DISPENSE",
      command_id: commandUuid,
      sale_id: sale.id,
      machine_id: inventory.machine_id,
      product_id: inventory.product_id,
      slot_id: inventory.slot_id,
      slot_code: inventory.slot_code,
      motor_id: inventory.motor_id,
      sensor_column_id: inventory.sensor_column_id,
      quantity: 1,
      attempts_allowed: 2,
      timeout_ms_per_attempt: 30000,
      issued_at: issuedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    };
  }

  async expireStaleDispenseForSale(saleId, context = {}) {
    const connection = await mysql.getPool().getConnection();
    const logs = [];

    try {
      await connection.beginTransaction();

      const commandBefore = normalizeDispenseCommand(
        await this.dispenseCommandDAO.findFirstBySaleIdForUpdate(saleId, connection),
      );
      if (!commandBefore || !["PENDING", "PUBLISHED", "ACKED", "EXPIRED"].includes(commandBefore.status)) {
        await connection.commit();
        return false;
      }

      const saleBefore = normalizeSale(await this.saleDAO.findByIdForUpdate(saleId, connection));
      if (!saleBefore || ["DISPENSED", "REFUNDED"].includes(saleBefore.status)) {
        await connection.commit();
        return false;
      }

      const existingRefunds = await this.findRefundTransactions(saleBefore.id, connection);
      if (commandBefore.status === "EXPIRED" && existingRefunds.length > 0) {
        await connection.commit();
        return false;
      }

      const ageBase = commandBefore.published_at || commandBefore.created_at;
      if (!this.isCommandExpired(ageBase)) {
        await connection.commit();
        return false;
      }

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
      const inventoryAfter =
        inventoryBefore && inventoryBefore.quantity_reserved > 0
          ? normalizeInventory(await this.inventoryDAO.releaseReserved(inventoryBefore.id, 1, connection))
          : inventoryBefore;

      const commandAfter = normalizeDispenseCommand(
        await this.dispenseCommandDAO.update(
          commandBefore.id,
          {
            status: "EXPIRED",
            completed_at: new Date(),
            last_error: "Processing timeout",
          },
          connection,
        ),
      );
      const failedSale = normalizeSale(
        await this.saleDAO.update(
          saleBefore.id,
          { status: "FAILED", failure_reason: "Processing timeout" },
          connection,
        ),
      );
      const walletBefore = normalizeWallet(
        await this.walletDAO.findByUserId(saleBefore.user_id, connection, { forUpdate: true }),
      );
      const walletAfter = normalizeWallet(
        await this.walletDAO.credit(walletBefore.id, saleBefore.total_cents, connection),
      );
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
            description: "Refund for processing timeout",
          },
          connection,
        ),
      );
      const saleAfter = normalizeSale(
        await this.saleDAO.update(saleBefore.id, { status: "REFUNDED" }, connection),
      );

      await connection.commit();

      if (inventoryBefore && inventoryAfter && inventoryBefore.id === inventoryAfter.id) {
        logs.push({
          eventType: "UPDATE",
          table: "inventory",
          recordId: inventoryAfter.id,
          before: inventoryBefore,
          after: inventoryAfter,
        });
      }
      logs.push(
        {
          eventType: "UPDATE",
          table: "dispense_commands",
          recordId: commandAfter.id,
          before: commandBefore,
          after: commandAfter,
          details: { timeout_ms: 60_000 },
        },
        { eventType: "UPDATE", table: "sales", recordId: failedSale.id, before: saleBefore, after: failedSale },
        { eventType: "UPDATE", table: "wallets", recordId: walletAfter.id, before: walletBefore, after: walletAfter },
        { eventType: "CREATE", table: "wallet_transactions", recordId: refund.id, after: refund },
        { eventType: "UPDATE", table: "sales", recordId: saleAfter.id, before: failedSale, after: saleAfter },
      );

      for (const log of logs) {
        await this.logCrud(log.eventType, { context, ...log });
      }

      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  isCommandExpired(value) {
    if (!value) return false;
    const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
    if (Number.isNaN(timestamp)) return false;
    return Date.now() - timestamp > 60 * 1000;
  }

  async findRefundTransactions(saleId, connection) {
    const [rows] = await connection.query(
      "SELECT id FROM wallet_transactions WHERE sale_id = ? AND type = 'REFUND' LIMIT 1",
      [saleId],
    );
    return rows;
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

module.exports = SaleService;
