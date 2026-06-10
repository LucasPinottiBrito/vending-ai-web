import { CatalogItem } from "./CatalogClient";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  items: CatalogItem[];
  slug: string;
  processingSlot: number | null;
  canSell: boolean;
  onCheckout: (item: CatalogItem) => void;
}

export function ProductGrid({ items, slug, processingSlot, canSell, onCheckout }: ProductGridProps) {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <ProductCard
          key={`${item.slot_id}-${item.product_id}`}
          item={item}
          slug={slug}
          isProcessing={processingSlot === item.slot_id}
          canSell={canSell}
          onCheckout={onCheckout}
        />
      ))}
    </div>
  );
}
