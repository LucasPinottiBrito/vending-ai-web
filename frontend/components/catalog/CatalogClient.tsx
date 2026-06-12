"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingState } from "@/components/feedback/LoadingState";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { getStoredSession } from "@/lib/auth";

import { EmptyState } from "./EmptyState";
import { MachineHeader } from "./MachineHeader";
import { ProductGrid } from "./ProductGrid";

export type CatalogMachine = {
  id: number;
  slug: string;
  name?: string;
  location?: string;
  status: string;
  can_sell: boolean;
};

export type CatalogItem = {
  id: number;
  inventory_id: number;
  slot_id: number;
  slot_code: string;
  motor_id: number;
  sensor_column_id: number;
  product_id: number;
  product_name: string;
  price_cents: number;
  image_url?: string;
  image_path?: string;
  quantity_available: number;
  quantity_reserved: number;
  available_for_sale: number;
};

type CatalogResponse = {
  machine: CatalogMachine;
  items: CatalogItem[];
};

export function CatalogClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingSlot, setProcessingSlot] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    apiRequest<CatalogResponse>(`/api/machines/slug/${slug}/catalog`, {
      token: null,
    })
      .then((response) => {
        if (isMounted) {
          setData(response.data);
          setError(null);
        }
      })
      .catch((caught) => {
        if (isMounted) {
          setError(caught);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return data?.items ?? [];
    }

    return (data?.items ?? []).filter((item) =>
      item.product_name.toLowerCase().includes(normalized),
    );
  }, [data?.items, query]);

  async function checkout(item: CatalogItem) {
    const session = getStoredSession();

    if (!session) {
      router.push(`/login?returnTo=${encodeURIComponent(`/m/${slug}`)}`);
      return;
    }

    if (!data || item.available_for_sale <= 0) {
      toast.error("Produto indisponivel para compra.");
      return;
    }

    setProcessingSlot(item.slot_id);

    try {
      const response = await apiRequest<{
        sale: { id: number };
      }>("/api/sales/checkout", {
        method: "POST",
        body: {
          machine_id: data.machine.id,
          slot_id: item.slot_id,
          product_id: item.product_id,
        },
        headers: {
          "Idempotency-Key":
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `checkout-${item.slot_id}-${Date.now()}`,
        },
      });

      toast.success("Compra autorizada");
      router.push(`/purchase/${response.data.sale.id}`);
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setProcessingSlot(null);
    }
  }

  if (isLoading) {
    return <LoadingState label="Carregando catalogo" />;
  }

  if (error) {
    return <ErrorAlert error={error} />;
  }

  if (!data) {
    return <EmptyState message="Maquina nao encontrada." />;
  }

  // Demo mode: until ESP32-S3 heartbeat is fully integrated, catalog displays machines as online.
  const demoCanSell = true;

  return (
    <div className="flex flex-col gap-6">
      <MachineHeader
        name={data.machine.name || "Maquina"}
        location={data.machine.location || data.machine.slug}
        status="ONLINE"
        canSell={demoCanSell}
      />

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar produto..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {filteredItems.length > 0 ? (
        <ProductGrid
          items={filteredItems}
          slug={slug}
          processingSlot={processingSlot}
          canSell={demoCanSell}
          onCheckout={checkout}
        />
      ) : (
        <EmptyState message="Nenhum produto encontrado para esta busca." />
      )}
    </div>
  );
}
