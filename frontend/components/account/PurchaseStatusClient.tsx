"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle, Info, Package } from "lucide-react";
import Link from "next/link";

import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingState } from "@/components/feedback/LoadingState";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import { SaleStatusBadge } from "./SaleStatusBadge";
import { PurchaseStatusTimeline } from "./PurchaseStatusTimeline";
import { ProblemReportButton } from "./ProblemReportButton";

type SaleDetail = {
  sale: {
    id: number;
    status: string;
    total_cents: number;
    machine_id: number;
  };
  items: Array<{
    product_id: number;
    product_name?: string;
    quantity: number;
    unit_price_cents: number;
    total_cents: number;
  }>;
  dispense_commands: Array<{
    id?: number;
    status: string;
    mqtt_topic?: string;
  }>;
};

const FINAL_STATES = ["DISPENSED", "FAILED", "REFUNDED"];

export function PurchaseStatusClient({ id }: { id: string }) {
  const [data, setData] = useState<SaleDetail | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await apiRequest<SaleDetail>(`/api/sales/${id}`);
      setData(response.data);
      
      if (FINAL_STATES.includes(response.data.sale.status)) {
        return true; // Should stop polling
      }
    } catch (caught) {
      setError(caught);
      return true; // Stop on error
    }
    return false;
  }, [id]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    async function poll() {
      const shouldStop = await fetchStatus();
      if (isMounted) {
        setIsLoading(false);
      }
      
      if (!shouldStop && isMounted) {
        timeoutId = setTimeout(poll, 3000);
      }
    }

    poll();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [fetchStatus]);

  if (isLoading && !data) {
    return (
      <RouteGuard>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-12">
          <LoadingState label="Consultando status da compra..." />
        </div>
      </RouteGuard>
    );
  }

  if (error && !data) {
    return (
      <RouteGuard>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-12">
          <ErrorAlert error={error} />
          <Button asChild variant="outline">
            <Link href="/account/purchases">Voltar para minhas compras</Link>
          </Button>
        </div>
      </RouteGuard>
    );
  }

  if (!data) return null;

  const { sale, items, dispense_commands: dispenseCommands } = data;
  const dispenseCommand = dispenseCommands[0] || null;
  const isDispensed = sale.status === "DISPENSED";
  const isFailed = sale.status === "FAILED" || sale.status === "REFUNDED";
  const isAwaitingCommandPublish =
    sale.status === "AUTHORIZED" && dispenseCommand?.status === "PENDING";

  return (
    <RouteGuard>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
        <Card className={cn(isDispensed && "border-primary", isFailed && "border-destructive")}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Pedido #{sale.id}</CardTitle>
              </div>
              <SaleStatusBadge status={sale.status} />
            </div>
            <CardDescription>
              {items[0]?.product_name || "Produto"} • {formatCurrency(sale.total_cents)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <PurchaseStatusTimeline currentStatus={sale.status} />

            {isAwaitingCommandPublish && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Aguardando envio para a maquina</AlertTitle>
                <AlertDescription>
                  O pagamento foi autorizado e o comando de entrega esta pendente. A tela sera atualizada
                  automaticamente quando a maquina iniciar a dispensa.
                </AlertDescription>
              </Alert>
            )}

            {isDispensed && (
              <Alert className="bg-primary/5 border-primary/20">
                <CheckCircle className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-bold">Produto Liberado!</AlertTitle>
                <AlertDescription>
                  Por favor, retire seu produto no bocal da máquina. Obrigado pela compra!
                </AlertDescription>
              </Alert>
            )}

            {isFailed && (
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Houve um problema</AlertTitle>
                <AlertDescription>
                  {sale.status === "REFUNDED" 
                    ? "O produto não foi detectado e seu saldo foi estornado automaticamente."
                    : "Não foi possível completar a entrega. Se o saldo foi debitado, entre em contato com o suporte."}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <ProblemReportButton saleId={sale.id} />
              
              {FINAL_STATES.includes(sale.status) && (
                <Button asChild variant="ghost">
                  <Link href="/account/purchases">Ver histórico de compras</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}

// Utility to handle conditional classes
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
