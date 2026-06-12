"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

import { CatalogItem } from "./CatalogClient";

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

function ProductImagePlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
      <div className="flex size-12 items-center justify-center rounded-full bg-background">
        <ImageOff className="h-5 w-5" />
      </div>
      <span className="text-xs font-medium">Imagem indisponivel</span>
    </div>
  );
}

export function ProductImage({ item }: { item: CatalogItem }) {
  const [hasError, setHasError] = useState(false);
  const imageUrl = resolveImageUrl(item);

  if (!imageUrl || hasError) {
    return <ProductImagePlaceholder />;
  }

  return (
    <Image
      src={imageUrl}
      alt={item.product_name}
      fill
      sizes="(max-width: 768px) 50vw, 240px"
      className="object-cover transition-transform hover:scale-105"
      onError={() => setHasError(true)}
    />
  );
}
