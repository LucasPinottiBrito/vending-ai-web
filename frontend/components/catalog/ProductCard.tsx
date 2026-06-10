import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { CatalogItem } from "./CatalogClient";

interface ProductCardProps {
  item: CatalogItem;
  slug: string;
  isProcessing: boolean;
  canSell: boolean;
  onCheckout: (item: CatalogItem) => void;
}

function resolveImageUrl(item: CatalogItem): string | null {
  if (item.image_url) {
    return item.image_url;
  }

  if (item.image_path) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    return `${apiUrl}${item.image_path}`;
  }

  return null;
}

export function ProductCard({ item, slug, isProcessing, canSell, onCheckout }: ProductCardProps) {
  const imageUrl = resolveImageUrl(item);
  const available = item.available_for_sale > 0 && canSell;

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={item.product_name}
              fill
              sizes="(max-width: 768px) 50vw, 240px"
              className="object-cover transition-transform hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Sem imagem
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-medium leading-tight line-clamp-2 min-h-[2.5rem]">
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
            Disponível: {item.available_for_sale}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <Button asChild variant="outline" size="sm">
            <Link href={`/m/${slug}/product/${item.product_id}`}>
              Detalhes
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={() => onCheckout(item)}
            disabled={!available || isProcessing}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isProcessing ? "Enviando" : "Comprar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
