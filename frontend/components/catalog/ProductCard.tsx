import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { CatalogItem } from "./CatalogClient";
import { ProductImage } from "./ProductImage";

interface ProductCardProps {
  item: CatalogItem;
  slug: string;
  isProcessing: boolean;
  canSell: boolean;
  onCheckout: (item: CatalogItem) => void;
}

export function ProductCard({
  item,
  slug,
  isProcessing,
  canSell,
  onCheckout,
}: ProductCardProps) {
  const available = item.available_for_sale > 0 && canSell;

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex h-full flex-col gap-3 p-4">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          <ProductImage item={item} />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="line-clamp-2 min-h-[2.5rem] font-medium leading-tight">
              {item.product_name}
            </h2>
            <Badge variant="outline" className="shrink-0">
              {item.slot_code}
            </Badge>
          </div>
          <p className="text-lg font-bold text-primary">
            {formatCurrency(item.price_cents)}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.available_for_sale > 0
              ? `Disponivel: ${item.available_for_sale}`
              : "Indisponivel"}
          </p>
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/m/${slug}/product/${item.product_id}`}>Detalhes</Link>
          </Button>
          <Button
            size="sm"
            onClick={() => onCheckout(item)}
            disabled={!available || isProcessing}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isProcessing ? "Processando" : available ? "Comprar" : "Indisponivel"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
