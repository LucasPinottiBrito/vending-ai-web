const IService = require("../interfaces/IService");
const ReportDAO = require("../dao/ReportDAO");
const LogService = require("./LogService");
const ApiError = require("../utils/ApiError");

class ReportService extends IService {
  constructor(reportDAO = new ReportDAO(), logService = new LogService()) {
    super();
    this.reportDAO = reportDAO;
    this.logService = logService;
  }

  async create(data, context = {}) {
    return this.generateSalesReport(data, context);
  }

  async getById() {
    throw new ApiError(501, "Report getById is not implemented", "NOT_IMPLEMENTED");
  }

  async list(filters = {}, context = {}) {
    return this.generateSalesReport(filters, context);
  }

  async update() {
    throw new ApiError(501, "Report update is not implemented", "NOT_IMPLEMENTED");
  }

  async delete() {
    throw new ApiError(501, "Report delete is not implemented", "NOT_IMPLEMENTED");
  }

  async generateSalesReport(filters = {}, context = {}) {
    const sales = await this.withItems(await this.reportDAO.findSales(filters));
    const summary = this.normalizeSummary(await this.reportDAO.getSalesSummary(filters));
    const report = {
      type: "sales",
      period: this.buildPeriod(filters),
      filters: this.buildFilters(filters),
      generated_by: this.buildGeneratedBy(context.user),
      generated_at: new Date().toISOString(),
      summary,
      sales: sales.map((sale) => this.normalizeSaleRow(sale)),
    };

    await this.logReport("sales", report, context);
    return report;
  }

  async generatePurchaseHistory(filters = {}, context = {}) {
    const sales = await this.withItems(await this.reportDAO.findSales(filters));
    const summary = this.normalizePurchaseSummary(await this.reportDAO.getSalesSummary(filters));
    const report = {
      type: "purchase_history",
      user_id: filters.user_id ? Number(filters.user_id) : null,
      period: this.buildPeriod(filters),
      filters: this.buildFilters(filters),
      generated_by: this.buildGeneratedBy(context.user),
      generated_at: new Date().toISOString(),
      summary,
      purchases: sales.map((sale) => this.normalizeSaleRow(sale)),
    };

    await this.logReport("purchase_history", report, context);
    return report;
  }

  async withItems(sales) {
    const saleIds = sales.map((sale) => Number(sale.id));
    const items = await this.reportDAO.findSaleItemsBySaleIds(saleIds);
    const itemsBySaleId = new Map();

    for (const item of items) {
      const saleItems = itemsBySaleId.get(Number(item.sale_id)) || [];
      saleItems.push(this.normalizeItemRow(item));
      itemsBySaleId.set(Number(item.sale_id), saleItems);
    }

    return sales.map((sale) => ({
      ...sale,
      items: itemsBySaleId.get(Number(sale.id)) || [],
    }));
  }

  normalizeSaleRow(row) {
    return {
      id: Number(row.id),
      user_id: Number(row.user_id),
      user_name: row.user_name,
      user_email: row.user_email,
      machine_id: Number(row.machine_id),
      machine_slug: row.machine_slug,
      machine_name: row.machine_name,
      status: row.status,
      payment_method: row.payment_method,
      total_cents: Number(row.total_cents),
      failure_reason: row.failure_reason || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      items: row.items || [],
    };
  }

  normalizeItemRow(row) {
    return {
      id: Number(row.id),
      sale_id: Number(row.sale_id),
      product_id: Number(row.product_id),
      product_sku: row.product_sku,
      product_name: row.product_name,
      slot_id: Number(row.slot_id),
      slot_code: row.slot_code,
      quantity: Number(row.quantity),
      unit_price_cents: Number(row.unit_price_cents),
      total_cents: Number(row.total_cents),
      created_at: row.created_at,
    };
  }

  normalizeSummary(row) {
    return {
      total_sold_cents: Number(row.total_sold_cents || 0),
      sales_count: Number(row.sales_count || 0),
      failure_count: Number(row.failure_count || 0),
      refund_count: Number(row.refund_count || 0),
    };
  }

  normalizePurchaseSummary(row) {
    const summary = this.normalizeSummary(row);
    return {
      total_spent_cents: summary.total_sold_cents,
      purchase_count: summary.sales_count,
      failure_count: summary.failure_count,
      refund_count: summary.refund_count,
    };
  }

  buildPeriod(filters = {}) {
    return {
      start_date: filters.start_date ? new Date(filters.start_date).toISOString() : null,
      end_date: filters.end_date ? new Date(filters.end_date).toISOString() : null,
    };
  }

  buildFilters(filters = {}) {
    return {
      start_date: filters.start_date ? new Date(filters.start_date).toISOString() : null,
      end_date: filters.end_date ? new Date(filters.end_date).toISOString() : null,
      machine_id: filters.machine_id ? Number(filters.machine_id) : null,
      status: filters.status || null,
      user_id: filters.user_id ? Number(filters.user_id) : null,
    };
  }

  buildGeneratedBy(user = null) {
    if (!user) {
      return null;
    }

    return {
      id: Number(user.id),
      name: user.name || null,
      email: user.email || null,
      role: user.role || null,
    };
  }

  async logReport(reportType, report, context = {}) {
    await this.logService.create({
      event_type: "GENERATE_PDF_REPORT",
      action: `${context.method || null} ${context.endpoint || null}`,
      method: context.method || null,
      endpoint: context.endpoint || null,
      status_code: context.status_code || null,
      response_time_ms: context.response_time_ms || 0,
      ip: context.ip || null,
      user_agent: context.user_agent || null,
      user_id: context.user?.id || null,
      username: context.user?.email || null,
      table: "sales",
      details: {
        report_type: reportType,
        filters: report.filters,
        summary: report.summary,
      },
    });
  }
}

module.exports = ReportService;
