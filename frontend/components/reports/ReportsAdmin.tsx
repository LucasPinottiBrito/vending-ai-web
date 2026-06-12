"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { jsPDF } from "jspdf";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import { reportFilterSchema } from "@/lib/validators";

type ReportFilters = z.infer<typeof reportFilterSchema>;

type SalesReport = {
  type: string;
  generated_by?: { name?: string; email?: string };
  filters?: Record<string, unknown>;
  summary: {
    total_sold_cents?: number;
    total_spent_cents?: number;
    sales_count?: number;
    purchase_count?: number;
    failure_count?: number;
    refund_count?: number;
  };
  sales?: Array<{
    id: number;
    status: string;
    total_cents: number;
  }>;
  purchases?: Array<{
    id: number;
    status: string;
    total_cents: number;
  }>;
};

function buildPdf(title: string, report: SalesReport) {
  const pdf = new jsPDF();
  const generatedAt = new Date().toLocaleString("pt-BR");
  const rows = report.sales || report.purchases || [];

  pdf.setFontSize(16);
  pdf.text(title, 14, 18);
  pdf.setFontSize(10);
  pdf.text(`Gerado em: ${generatedAt}`, 14, 26);
  pdf.text(`Gerado por: ${report.generated_by?.email || "-"}`, 14, 32);
  pdf.text(`Filtros: ${JSON.stringify(report.filters || {})}`, 14, 38);

  pdf.setFontSize(12);
  pdf.text("Resumo", 14, 50);
  pdf.setFontSize(10);
  pdf.text(
    `Total: ${formatCurrency(report.summary.total_sold_cents ?? report.summary.total_spent_cents ?? 0)}`,
    14,
    58,
  );
  pdf.text(
    `Quantidade: ${report.summary.sales_count ?? report.summary.purchase_count ?? 0}`,
    14,
    64,
  );
  pdf.text(`Falhas: ${report.summary.failure_count ?? 0}`, 14, 70);
  pdf.text(`Estornos: ${report.summary.refund_count ?? 0}`, 14, 76);

  pdf.setFontSize(12);
  pdf.text("Registros", 14, 90);
  pdf.setFontSize(10);
  rows.slice(0, 28).forEach((row, index) => {
    const y = 100 + index * 6;
    pdf.text(
      `#${row.id} | ${row.status} | ${formatCurrency(row.total_cents)}`,
      14,
      y,
    );
  });

  pdf.setFontSize(8);
  pdf.text("Vending AI Web Platform", 14, 286);
  pdf.save(`${report.type || "report"}.pdf`);
}

export function ReportsAdmin() {
  const [isWorking, setIsWorking] = useState(false);
  const form = useForm<ReportFilters>({
    resolver: zodResolver(reportFilterSchema),
    defaultValues: {
      start_date: "",
      end_date: "",
      machine_id: "",
      status: "",
    },
  });
  const statusValue = useWatch({ control: form.control, name: "status" });

  async function generateSalesReport(values: ReportFilters) {
    setIsWorking(true);
    try {
      const response = await apiRequest<{ report: SalesReport }>(
        "/api/admin/reports/sales",
        { query: values },
      );
      buildPdf("Relatorio de vendas", response.data.report);
      toast.success("PDF de vendas gerado");
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsWorking(false);
    }
  }

  async function generatePurchaseHistory(values: ReportFilters) {
    setIsWorking(true);
    try {
      const response = await apiRequest<{ report: SalesReport }>(
        "/api/admin/reports/purchase-history",
        { query: values },
      );
      buildPdf("Historico de compras", response.data.report);
      toast.success("PDF de historico gerado");
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <AdminShell>
      <PageHeader title="Relatorios PDF" description="Gere documentos de vendas para analise e apresentacao." />
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Escolha o periodo e os filtros para montar o relatorio de vendas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="start_date">Inicio</Label>
              <Input id="start_date" type="datetime-local" {...form.register("start_date")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="end_date">Fim</Label>
              <Input id="end_date" type="datetime-local" {...form.register("end_date")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="machine_id">machine_id</Label>
              <Input id="machine_id" {...form.register("machine_id")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select
                value={statusValue || "all"}
                onValueChange={(value) =>
                  form.setValue("status", value === "all" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Todos</SelectItem>
                    {["CREATED", "AUTHORIZED", "DISPENSING", "DISPENSED", "FAILED", "REFUNDED"].map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 md:col-span-4">
              <Button
                type="button"
                disabled={isWorking}
                onClick={form.handleSubmit(generateSalesReport)}
              >
                PDF vendas
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isWorking}
                onClick={form.handleSubmit(generatePurchaseHistory)}
              >
                PDF historico
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
