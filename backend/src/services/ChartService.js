const IService = require("../interfaces/IService");
const ReportDAO = require("../dao/ReportDAO");
const LogService = require("./LogService");
const ApiError = require("../utils/ApiError");

class ChartService extends IService {
  constructor(reportDAO = new ReportDAO(), logService = new LogService()) {
    super();
    this.reportDAO = reportDAO;
    this.logService = logService;
  }

  async create() {
    throw new ApiError(501, "Chart create is not implemented", "NOT_IMPLEMENTED");
  }

  async getById() {
    throw new ApiError(501, "Chart getById is not implemented", "NOT_IMPLEMENTED");
  }

  async list(filters = {}, context = {}) {
    return this.getSalesByMonth(filters, context);
  }

  async update() {
    throw new ApiError(501, "Chart update is not implemented", "NOT_IMPLEMENTED");
  }

  async delete() {
    throw new ApiError(501, "Chart delete is not implemented", "NOT_IMPLEMENTED");
  }

  async getSalesByMonth(filters = {}, context = {}) {
    const rows = await this.reportDAO.findSalesByMonth(filters);
    const labels = rows.map((row) => row.month);
    const salesCounts = rows.map((row) => Number(row.sales_count));
    const totals = rows.map((row) => Number(row.total_sold_cents));
    const failures = rows.map((row) => Number(row.failure_count));
    const refunds = rows.map((row) => Number(row.refund_count));

    const chart = {
      type: "sales_by_month",
      generated_at: new Date().toISOString(),
      filters: {
        year: filters.year ? Number(filters.year) : null,
      },
      labels,
      datasets: [
        {
          label: "Quantidade de vendas",
          data: salesCounts,
        },
        {
          label: "Total vendido (centavos)",
          data: totals,
        },
        {
          label: "Falhas",
          data: failures,
        },
        {
          label: "Estornos",
          data: refunds,
        },
      ],
    };

    await this.logService.create({
      event_type: "GENERATE_CHART_DATA",
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
        chart_type: "sales_by_month",
        filters: chart.filters,
        labels_count: labels.length,
      },
    });

    return chart;
  }
}

module.exports = ChartService;
