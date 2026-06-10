"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { CatalogItem } from "@/components/catalog/CatalogClient";
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
import { apiRequest } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";

export function ProductDetailClient({
  slug,
  productId,
}: {
  slug: string;
  productId: string;
}) {
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ items: CatalogItem[] }>(`/api/machines/slug/${slug}/catalog`, {
      token: null,
    })
      .then((response) => {
        const found = response.data.items.find(
          (candidate) => Number(candidate.product_id) === Number(productId),
        );
        setItem(found ?? null);
      })
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [productId, slug]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorAlert error={error} />;
  }

  if (!item) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Produto nao encontrado</CardTitle>
          <CardDescription>
            O catalogo da maquina nao retornou este produto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={`/m/${slug}`}>Voltar ao catalogo</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.product_name}</CardTitle>
        <CardDescription>Slot {item.slot_code}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Preco</dt>
            <dd className="font-medium">{formatCurrency(item.price_cents)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Disponivel</dt>
            <dd className="font-medium">{item.available_for_sale}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Motor</dt>
            <dd className="font-medium">{item.motor_id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Sensor</dt>
            <dd className="font-medium">{item.sensor_column_id}</dd>
          </div>
        </dl>
        <Button asChild>
          <Link href={`/m/${slug}/checkout/${item.slot_id}`}>Continuar compra</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
