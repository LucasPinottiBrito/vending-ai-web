"use client";

import { useEffect, useState } from "react";
import { AccountNav } from "@/components/layout/AccountNav";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import { AccountSummary } from "./AccountSummary";
import { WalletBalanceCard } from "./WalletBalanceCard";

type WalletResponse = {
  wallet: {
    id: number;
    user_id: number;
    balance_cents: number;
  };
};

export function AccountDashboard() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | undefined>(undefined);

  useEffect(() => {
    apiRequest<WalletResponse>("/api/wallet/balance")
      .then((response) => setBalance(response.data.wallet.balance_cents))
      .catch(() => setBalance(undefined));
  }, []);

  return (
    <RouteGuard>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
        <AccountNav />
        
        <div className="grid gap-6 md:grid-cols-2">
          <AccountSummary 
            name={user?.name} 
            email={user?.email} 
            role={user?.role} 
          />
          <WalletBalanceCard 
            balanceCents={balance} 
          />
        </div>
      </div>
    </RouteGuard>
  );
}
