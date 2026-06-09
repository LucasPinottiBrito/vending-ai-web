"use client";

import { useState, use } from "react";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2 } from "lucide-react";

// Mock data for initial shape
const MOCK_PRODUCTS = [
  { id: 1, name: "Coca-Cola 350ml", price: 500, quantity_available: 10, image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80" },
  { id: 2, name: "Pepsi 350ml", price: 450, quantity_available: 5, image_url: "https://images.unsplash.com/photo-1546202159-f8087933100c?w=400&q=80" },
  { id: 3, name: "Água Mineral 500ml", price: 300, quantity_available: 0, image_url: "https://images.unsplash.com/photo-1560023907-5f339617ea30?w=400&q=80" },
  { id: 4, name: "Suco de Laranja 300ml", price: 600, quantity_available: 8, image_url: "https://images.unsplash.com/photo-1621506289937-4c72179d548f?w=400&q=80" },
  { id: 5, name: "Chocolate Barra", price: 750, quantity_available: 12, image_url: "https://images.unsplash.com/photo-1511381939415-e44015466834?w=400&q=80" },
  { id: 6, name: "Batata Chips", price: 800, quantity_available: 3, image_url: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80" },
];

export default function CatalogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [search, setSearch] = useState("");
  const [balance, setBalance] = useState(2500); // R$ 25,00
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  const filteredProducts = MOCK_PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleBuy = async (product: any) => {
    if (balance < product.price) {
      alert("Saldo insuficiente!");
      return;
    }

    setIsProcessing(product.id);
    
    // Simulate IoT dispense delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setBalance((prev) => prev - product.price);
    setIsProcessing(null);
    alert(`${product.name} dispensado com sucesso!`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar machineName={`Máquina: ${slug.toUpperCase()}`} balance={balance} />

      <main className="mx-auto max-w-lg px-4 py-6">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder="O que você deseja hoje?"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-brand-surface bg-brand-surface py-3 pl-10 pr-4 text-sm font-medium outline-none transition-all focus:border-brand-primary/20 focus:ring-4 focus:ring-brand-primary/5"
          />
        </div>

        {/* Product Grid */}
        <motion.div 
          layout
          className="grid grid-cols-2 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onBuy={handleBuy}
                isProcessing={isProcessing === product.id}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-20 flex flex-col items-center justify-center text-center"
          >
            <div className="mb-4 rounded-full bg-brand-surface p-4">
              <Search className="h-8 w-8 text-brand-muted" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Nenhum produto encontrado</h3>
            <p className="text-sm text-brand-muted">Tente buscar por outro nome ou limpe o filtro.</p>
          </motion.div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="mt-auto py-8 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted/40">
          Vending AI Web • Academic Project
        </p>
      </footer>
    </div>
  );
}
