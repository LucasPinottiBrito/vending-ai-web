"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Calendar, FilterX } from "lucide-react";

import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingState } from "@/components/feedback/LoadingState";
import { AccountNav } from "@/components/layout/AccountNav";
import { RouteGuard } from "@/components/layout/RouteGuard";
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
import { SaleStatusBadge } from "./SaleStatusBadge";

type Purchase = {
  id: number;
  status: string;
  total_cents: number;
  created_at?: string;
  machine_name?: string;
  product_name?: string;
};

export function PurchasesClient() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [status, setStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (status !== "all") queryParams.append("status", status);
      if (startDate) queryParams.append("start_date", startDate);
      if (endDate) queryParams.append("end_date", endDate);

      const response = await apiRequest<{ purchases: Purchase[] }>(
        `/api/users/me/purchases?${queryParams.toString()}`
      );
      setPurchases(response.data.purchases);
      setError(null);
    } catch (caught) {
      setError(caught);
    } finally {
      setIsLoading(false);
    }
  }, [status, startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  const clearFilters = () => {
    setStatus("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <RouteGuard>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        <AccountNav />
        
        <Card>
          <CardHeader>
            <CardTitle>Meus Pedidos</CardTitle>
            <CardDescription>Consulte seu histórico de compras e status de entrega.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
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
              
              <div className="space-y-2">
                <label className="text-sm font-medium">De</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    type="date" 
                    className="pl-9" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Até</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    type="date" 
                    className="pl-9" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <Button variant="outline" onClick={clearFilters} disabled={isLoading}>
                <FilterX className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <LoadingState label="Carregando histórico..." />
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
                      <TableHead>Máquina</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[100px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          Nenhum pedido encontrado com estes filtros.
                        </TableCell>
                      </TableRow>
                    ) : (
                      purchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell className="font-mono text-xs">#{purchase.id}</TableCell>
                          <TableCell className="font-medium">{purchase.product_name || "Produto"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{purchase.machine_name || "Máquina"}</TableCell>
                          <TableCell className="text-sm">{formatDateTime(purchase.created_at)}</TableCell>
                          <TableCell>
                            <SaleStatusBadge status={purchase.status} />
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(purchase.total_cents)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/account/purchases/${purchase.id}`}>Detalhes</Link>
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
      </div>
    </RouteGuard>
  );
}
