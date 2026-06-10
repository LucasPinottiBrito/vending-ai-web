"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, Wallet } from "lucide-react";
import Link from "next/link";

import { CatalogItem, CatalogMachine } from "@/components/catalog/CatalogClient";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingState } from "@/components/feedback/LoadingState";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { getStoredSession } from "@/lib/auth";
import { formatCurrency } from "@/lib/formatters";
import { CheckoutSummary } from "./CheckoutSummary";

export function CheckoutClient({
  slug,
  slotId,
}: {
  slug: string;
  slotId: string;
}) {
  const router = useRouter();
  const [machine, setMachine] = useState<CatalogMachine | null>(null);
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [catalogRes, balanceRes] = await Promise.all([
          apiRequest<{ machine: CatalogMachine; items: CatalogItem[] }>(
            `/api/machines/slug/${slug}/catalog`,
            { token: null },
          ),
          apiRequest<{ wallet: { balance_cents: number } }>("/api/wallet/balance").catch(() => null),
        ]);

        setMachine(catalogRes.data.machine);
        setItem(
          catalogRes.data.items.find(
            (candidate) => Number(candidate.slot_id) === Number(slotId),
          ) ?? null,
        );
        
        if (balanceRes) {
          setBalance(balanceRes.data.wallet.balance_cents);
        }
      } catch (caught) {
        setError(caught);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [slotId, slug]);

  async function checkout() {
    const session = getStoredSession();

    if (!session) {
      router.push(`/login?returnTo=${encodeURIComponent(`/m/${slug}/checkout/${slotId}`)}`);
      return;
    }

    if (!item || !machine) return;

    if (balance !== null && balance < item.price_cents) {
      toast.error("Saldo insuficiente");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest<{ sale: { id: number } }>(
        "/api/sales/checkout",
        {
          method: "POST",
          body: {
            machine_id: machine.id,
            slot_id: item.slot_id,
            product_id: item.product_id,
          },
          headers: {
            "Idempotency-Key":
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `checkout-${item.slot_id}-${Date.now()}`,
          },
        },
      );

      toast.success("Compra autorizada");
      router.push(`/purchase/${response.data.sale.id}`);
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <LoadingState label="Carregando detalhes do checkout..." />;
  }

  if (error) {
    return <ErrorAlert error={error} />;
  }

  if (!item || !machine) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Item ou Máquina indisponível</CardTitle>
          <CardDescription>Não foi possível carregar os dados para este checkout.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href={`/m/${slug}`}>Voltar ao catálogo</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasBalance = balance === null || balance >= item.price_cents;
  const isMachineOnline = machine.status === "ONLINE";

  return (
    <div className="flex flex-col gap-6">
      <CheckoutSummary 
        item={item} 
        machineName={machine.name} 
        machineLocation={machine.location} 
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Pagamento</CardTitle>
            </div>
            {balance !== null && (
              <p className="font-semibold">{formatCurrency(balance)}</p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isMachineOnline && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Máquina Offline</AlertTitle>
              <AlertDescription>
                Esta máquina não está aceitando vendas no momento.
              </AlertDescription>
            </Alert>
          )}

          {!hasBalance && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Saldo Insuficiente</AlertTitle>
              <AlertDescription className="flex flex-col gap-2">
                Você precisa de mais {formatCurrency(item.price_cents - (balance || 0))} para esta compra.
                <Button asChild size="sm" variant="outline" className="w-fit">
                  <Link href="/account/wallet/topup">Recarregar agora</Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={checkout}
            disabled={isSubmitting || item.available_for_sale <= 0 || !hasBalance || !isMachineOnline}
          >
            {isSubmitting ? "Autorizando..." : "Confirmar e Comprar"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Ao clicar em confirmar, o saldo será debitado imediatamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
