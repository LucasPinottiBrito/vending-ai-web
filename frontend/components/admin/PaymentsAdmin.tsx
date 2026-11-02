"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { Calendar, FilterX, Search, WalletCards } from "lucide-react";

import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingState } from "@/components/feedback/LoadingState";
import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

type AdminPayment = {
  id: number;
  user_id: number;
  user_name?: string | null;
  user_email?: string | null;
  type: string;
  provider: string;
  amount_cents: number;
  status: string;
  created_at?: string | null;
  paid_at?: string | null;
};

function paymentStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "PAID") return "secondary";
  if (status === "PENDING") return "outline";
  if (status === "FAILED" || status === "CANCELED" || status === "EXPIRED") return "destructive";
  return "outline";
}

export function PaymentsAdmin() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest<{ payments: AdminPayment[] }>("/api/admin/payments", {
        query: {
          search,
          status,
          type,
          start_date: startDate,
          end_date: endDate,
          limit: 100,
        },
      });
      setPayments(response.data.payments);
      setError(null);
    } catch (caught) {
      setError(caught);
    } finally {
      setIsLoading(false);
    }
  }, [endDate, search, startDate, status, type]);

  useEffect(() => {
    startTransition(async () => {
      await load();
    });
  }, [load]);

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setType("all");
    setStartDate("");
    setEndDate("");
  }

  return (
    <AdminShell>
      <PageHeader
        title="Pagamentos"
        description="Acompanhe recargas mock, valores e status de confirmacao."
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="min-w-[220px] flex-1 space-y-2">
              <label className="text-sm font-medium">Usuario ou referencia</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar pagamento..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 lg:w-[160px]">
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="PAID">Pago</SelectItem>
                  <SelectItem value="EXPIRED">Expirado</SelectItem>
                  <SelectItem value="FAILED">Falha</SelectItem>
                  <SelectItem value="CANCELED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 lg:w-[170px]">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="MOCK_TOPUP">Recarga mock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Inicio</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-9 lg:w-[155px]"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fim</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-9 lg:w-[155px]"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>
            </div>

            <Button variant="outline" onClick={clearFilters}>
              <FilterX data-icon="inline-start" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && payments.length === 0 ? (
        <LoadingState label="Carregando pagamentos..." />
      ) : error ? (
        <ErrorAlert error={error} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Pago em</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Nenhum pagamento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">#{payment.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                            <WalletCards className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{payment.user_name || `Usuario #${payment.user_id}`}</span>
                            <span className="text-xs text-muted-foreground">{payment.user_email || "-"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{payment.type}</TableCell>
                      <TableCell>
                        <Badge variant={paymentStatusVariant(payment.status)}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(payment.created_at)}</TableCell>
                      <TableCell>{formatDateTime(payment.paid_at)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(payment.amount_cents)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </AdminShell>
  );
}
