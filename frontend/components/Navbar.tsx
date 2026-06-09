"use client";

import { motion } from "framer-motion";
import { Wallet, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface NavbarProps {
  machineName: string;
  balance: number;
}

export function Navbar({ machineName, balance }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-brand-muted">
            <MapPin className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Você está em</span>
          </div>
          <span className="text-sm font-bold text-foreground">{machineName}</span>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 rounded-full bg-brand-surface px-3 py-1.5 border border-brand-primary/10"
        >
          <Wallet className="h-4 w-4 text-brand-primary" />
          <span className="text-sm font-bold text-brand-primary">
            {formatCurrency(balance)}
          </span>
        </motion.div>
      </div>
    </nav>
  );
}
