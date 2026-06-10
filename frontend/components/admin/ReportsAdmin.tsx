"use client";

import { useState, useCallback, useEffect } from "react";
import { FileText, Download, Calendar, FilterX, Receipt } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { useAuth } from "@/hooks/useAuth";

type Machine = { id: number; name: string };
type Sale = {
  id: number;
  user_name?: string;
  user_email?: string;
  machine_name?: string;
  product_name?: string;
  status: string;
  total_cents: number;
  created_at: string;
};
type Summary = {
  total_sold_cents: number;
  sales_count: number;
  failure_count: number;
  refund_count: number;
};

export function ReportsAdmin() {
  const { user } = useAuth();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filters
  const [status, setStatus] = useState<string>("all");
  const [machineId, setMachineId] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    apiRequest<{ machines: Machine[] }>("/api/machines", { query: { active: "active" } })
      .then(res => setMachines(res.data.machines))
      .catch(console.error);
  }, []);

  const generatePDF = useCallback(async () => {
    setIsGenerating(true);
    try {
      const queryParams = new URLSearchParams();
      if (status !== "all") queryParams.append("status", status);
      if (machineId !== "all") queryParams.append("machine_id", machineId);
      if (startDate) queryParams.append("start_date", startDate);
      if (endDate) queryParams.append("end_date", endDate);

      const response = await apiRequest<{
        report: {
          sales: Sale[];
          summary: Summary;
          filters: any;
        };
      }>(`/api/admin/reports/sales?${queryParams.toString()}`);

      const { sales, summary } = response.data.report;

      const doc = new jsPDF();
      const margin = 20;
      let y = 20;

      // Header
      doc.setFontSize(22);
      doc.setTextColor(40, 40, 40);
      doc.text("Relatório de Vendas", margin, y);
      y += 10;

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, margin, y);
      doc.text(`Por: ${user?.name || user?.email || "Administrador"}`, 120, y);
      y += 15;

      // Filters Summary
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Filtros Aplicados:", margin, y);
      y += 6;
      doc.setFontSize(10);
      doc.text(`Período: ${startDate || "Início"} até ${endDate || "Hoje"}`, margin + 5, y);
      y += 5;
      doc.text(`Máquina: ${machineId === "all" ? "Todas" : machines.find(m => m.id.toString() === machineId)?.name}`, margin + 5, y);
      y += 5;
      doc.text(`Status: ${status === "all" ? "Todos" : status}`, margin + 5, y);
      y += 15;

      // Summary Cards (drawn manually)
      doc.setDrawColor(200, 200, 200);
      doc.rect(margin, y, 170, 30);
      doc.setFontSize(11);
      doc.text("Resumo Financeiro e Operacional", margin + 5, y + 8);
      
      doc.setFontSize(10);
      doc.text(`Total Vendido: ${formatCurrency(summary.total_sold_cents)}`, margin + 10, y + 18);
      doc.text(`Qtd. Vendas: ${summary.sales_count}`, margin + 10, y + 24);
      doc.text(`Falhas: ${summary.failure_count}`, margin + 90, y + 18);
      doc.text(`Estornos: ${summary.refund_count}`, margin + 90, y + 24);
      y += 45;

      // Table Header
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(60, 60, 60);
      doc.rect(margin, y, 170, 8, "F");
      doc.text("ID", margin + 2, y + 6);
      doc.text("Data", margin + 15, y + 6);
      doc.text("Produto", margin + 55, y + 6);
      doc.text("Status", margin + 115, y + 6);
      doc.text("Valor", margin + 150, y + 6);
      y += 8;

      // Table Rows
      doc.setTextColor(0, 0, 0);
      sales.slice(0, 25).forEach((sale, i) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        if (i % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, y, 170, 7, "F");
        }
        
        doc.setFontSize(9);
        doc.text(`#${sale.id}`, margin + 2, y + 5);
        doc.text(new Date(sale.created_at).toLocaleDateString("pt-BR"), margin + 15, y + 5);
        doc.text(sale.product_name?.substring(0, 30) || "Produto", margin + 55, y + 5);
        doc.text(sale.status, margin + 115, y + 5);
        doc.text(formatCurrency(sale.total_cents), margin + 150, y + 5);
        y += 7;
      });

      if (sales.length > 25) {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`... e mais ${sales.length - 25} registros não exibidos nesta prévia.`, margin, y + 5);
      }

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Vending AI Web Platform - Página ${i} de ${pageCount}`,
          margin,
          285
        );
      }

      doc.save(`relatorio-vendas-${startDate || "geral"}.pdf`);
      toast.success("Relatório PDF gerado com sucesso!");
    } catch (caught) {
      toast.error("Falha ao gerar relatório: " + (caught instanceof Error ? caught.message : "Erro desconhecido"));
    } finally {
      setIsGenerating(false);
    }
  }, [startDate, endDate, machineId, status, user, machines]);

  return (
    <AdminShell>
      <PageHeader
        title="Relatórios PDF"
        description="Gere documentos profissionais para auditoria e prestação de contas."
      />

      <div className="grid gap-6 md:grid-cols-[400px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Configurar Filtros</CardTitle>
            <CardDescription>O PDF incluirá o resumo e a tabela detalhada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Período</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Calendar className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <Input type="date" className="pl-7 text-xs" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <Input type="date" className="pl-7 text-xs" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Máquina</label>
              <Select value={machineId} onValueChange={setMachineId}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as máquinas</SelectItem>
                  {machines.map(m => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Status das Vendas</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="AUTHORIZED">Autorizadas</SelectItem>
                  <SelectItem value="DISPENSED">Entregues</SelectItem>
                  <SelectItem value="FAILED">Falhas</SelectItem>
                  <SelectItem value="REFUNDED">Estornadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 flex flex-col gap-2">
              <Button className="w-full" size="lg" onClick={generatePDF} disabled={isGenerating}>
                {isGenerating ? (
                  "Processando..."
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Gerar Relatório PDF
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setStatus("all"); setMachineId("all"); }}>
                <FilterX className="mr-2 h-3 w-3" />
                Resetar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Visualização Prévia</h3>
              <p className="max-w-xs text-sm text-muted-foreground">
                O arquivo gerado conterá a listagem completa de transações, 
                totais financeiros e estatísticas de sucesso/falha conforme 
                os filtros selecionados ao lado.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Dicas de Uso</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>• Utilize períodos mensais para fechamento de caixa.</p>
              <p>• Filtre por máquinas específicas para analisar o desempenho de localizações isoladas.</p>
              <p>• O PDF é gerado diretamente no navegador para maior privacidade.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
