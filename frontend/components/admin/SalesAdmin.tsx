"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Calendar, FilterX, Receipt, Eye } from "lucide-react";

import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingState } from "@/components/feedback/LoadingState";
import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { SaleStatusBadge } from "@/components/account/SaleStatusBadge";

type Sale = {
  id: number;
  user_email?: string;
  user_name?: string;
  machine_name?: string;
  product_name?: string;
  status: string;
  total_cents: number;
  created_at?: string;
};

type Summary = {
  total_sold_cents: number;
  sales_count: number;
  failure_count: number;
  refund_count: number;
};

type Machine = { id: number; name: string };

export function SalesAdmin() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState<string>("all");
  const [machineId, setMachineId] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (status !== "all") queryParams.append("status", status);
      if (machineId !== "all") queryParams.append("machine_id", machineId);
      if (startDate) queryParams.append("start_date", startDate);
      if (endDate) queryParams.append("end_date", endDate);

      const [salesRes, machinesRes] = await Promise.all([
        apiRequest<{ report: { sales: Sale[]; summary: Summary } }>(
          `/api/admin/reports/sales?${queryParams.toString()}`
        ),
        apiRequest<{ machines: Machine[] }>("/api/machines", { query: { active: "active" } }),
      ]);

      setSales(salesRes.data.report.sales);
      setSummary(salesRes.data.report.summary);
      setMachines(machinesRes.data.machines);
      setError(null);
    } catch (caught) {
      setError(caught);
    } finally {
      setIsLoading(false);
    }
  }, [status, machineId, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const clearFilters = () => {
    setStatus("all");
    setMachineId("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <AdminShell>
      <PageHeader
        title="Gestão de Vendas"
        description="Monitore todas as transações, falhas e estornos do sistema."
      />

      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receita Bruta</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.total_sold_cents)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
              <div className="h-4 w-4 rounded-full bg-primary/20" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.sales_count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Falhas</CardTitle>
              <div className="h-4 w-4 rounded-full bg-destructive/20" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{summary.failure_count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Estornos</CardTitle>
              <div className="h-4 w-4 rounded-full bg-amber-500/20" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{summary.refund_count}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-[180px] space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="AUTHORIZED">Autorizada</SelectItem>
                  <SelectItem value="DISPENSING">Dispensando</SelectItem>
                  <SelectItem value="DISPENSED">Entregue</SelectItem>
                  <SelectItem value="FAILED">Falha</SelectItem>
                  <SelectItem value="REFUNDED">Estornada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[180px] space-y-2">
              <label className="text-sm font-medium">Máquina</label>
              <Select value={machineId} onValueChange={setMachineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Máquina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas máquinas</SelectItem>
                  {machines.map(m => (
                    <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Início</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="date" className="pl-9 w-[160px]" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fim</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="date" className="pl-9 w-[160px]" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>

            <Button variant="outline" onClick={clearFilters} disabled={isLoading}>
              <FilterX className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && sales.length === 0 ? (
        <LoadingState label="Carregando transações..." />
      ) : error ? (
        <ErrorAlert error={error} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Máquina</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        Nenhuma venda encontrada com estes filtros.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-xs">#{sale.id}</TableCell>
                        <TableCell className="font-medium">{sale.product_name || "Produto"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{sale.user_name || "N/A"}</span>
                            <span className="text-xs text-muted-foreground">{sale.user_email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{sale.machine_name || "Máquina"}</TableCell>
                        <TableCell className="text-sm">{formatDateTime(sale.created_at)}</TableCell>
                        <TableCell>
                          <SaleStatusBadge status={sale.status} />
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(sale.total_cents)}
                        </TableCell>
                        <TableCell>
                          <Button asChild variant="ghost" size="icon">
                            <Link href={`/purchase/${sale.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </AdminShell>
  );
}
