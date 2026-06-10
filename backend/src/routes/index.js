const { Router } = require("express");

const AuthRoutes = require("./AuthRoutes");
const ChartRoutes = require("./ChartRoutes");
const DashboardRoutes = require("./DashboardRoutes");
const HealthRoutes = require("./HealthRoutes");
const ImportExportRoutes = require("./ImportExportRoutes");
const InventoryRoutes = require("./InventoryRoutes");
const LogRoutes = require("./LogRoutes");
const MachineRoutes = require("./MachineRoutes");
const PaymentRoutes = require("./PaymentRoutes");
const ProductRoutes = require("./ProductRoutes");
const ReportRoutes = require("./ReportRoutes");
const SaleRoutes = require("./SaleRoutes");
const SlotRoutes = require("./SlotRoutes");
const WalletRoutes = require("./WalletRoutes");

function createMainRouter() {
  const router = Router();

  router.use(new HealthRoutes().getRouter());
  router.use(new AuthRoutes().getRouter());
  router.use(new ProductRoutes().getRouter());
  router.use(new MachineRoutes().getRouter());
  router.use(new SlotRoutes().getRouter());
  router.use(new InventoryRoutes().getRouter());
  router.use(new WalletRoutes().getRouter());
  router.use(new PaymentRoutes().getRouter());
  router.use(new SaleRoutes().getRouter());
  router.use(new ImportExportRoutes().getRouter());
  router.use(new LogRoutes().getRouter());
  router.use(new ReportRoutes().getRouter());
  router.use(new ChartRoutes().getRouter());
  router.use(new DashboardRoutes().getRouter());

  return router;
}

module.exports = createMainRouter;
