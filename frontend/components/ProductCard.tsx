"use client";

import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface Product {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  quantity_available: number;
}

interface ProductCardProps {
  product: Product;
  onBuy: (product: Product) => void;
  isProcessing?: boolean;
}

export function ProductCard({ product, onBuy, isProcessing }: ProductCardProps) {
  const isSoldOut = product.quantity_available <= 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-white p-3 shadow-sm transition-shadow hover:shadow-md",
        isSoldOut && "opacity-75 grayscale"
      )}
    >
      {/* Product Image */}
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-brand-surface">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-muted">
            No Image
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="mt-3 flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground line-clamp-1">
          {product.name}
        </h3>
        <p className="text-lg font-bold text-brand-primary">
          {formatCurrency(product.price)}
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={() => !isSoldOut && onBuy(product)}
        disabled={isSoldOut || isProcessing}
        className={cn(
          "mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors",
          isSoldOut
            ? "bg-brand-muted/10 text-brand-muted cursor-not-allowed"
            : "bg-brand-primary text-white hover:bg-brand-primary/90 active:scale-[0.97]"
        )}
      >
        {isProcessing ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
          />
        ) : isSoldOut ? (
          "Sold Out"
        ) : (
          <>
            <ShoppingCart className="h-4 w-4" />
            Buy Now
          </>
        )}
      </button>

      {/* Sold Out Overlay */}
      {isSoldOut && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
          <span className="rounded-full bg-brand-muted px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
            Esgotado
          </span>
        </div>
      )}
    </motion.div>
  );
}
