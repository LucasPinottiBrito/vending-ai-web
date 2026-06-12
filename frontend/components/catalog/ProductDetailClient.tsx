"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { CatalogItem } from "@/components/catalog/CatalogClient";
import { ProductImage } from "@/components/catalog/ProductImage";
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
            Este item nao esta disponivel no catalogo da maquina.
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
      <CardContent className="grid gap-5 md:grid-cols-[280px_1fr]">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          <ProductImage item={item} />
        </div>
        <div className="flex flex-col gap-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Preco</dt>
              <dd className="font-medium">{formatCurrency(item.price_cents)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Disponibilidade</dt>
              <dd className="font-medium">
                {item.available_for_sale > 0
                  ? `${item.available_for_sale} unidade(s)`
                  : "Indisponivel"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Codigo do slot</dt>
              <dd className="font-medium">{item.slot_code}</dd>
            </div>
          </dl>
          {item.available_for_sale > 0 ? (
            <Button asChild>
              <Link href={`/m/${slug}/checkout/${item.slot_id}`}>
                Continuar compra
              </Link>
            </Button>
          ) : (
            <Button disabled>Indisponivel</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
