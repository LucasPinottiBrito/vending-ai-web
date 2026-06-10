"use client";

import { useCallback, useEffect, useState } from "react";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingState } from "@/components/feedback/LoadingState";
import { AccountNav } from "@/components/layout/AccountNav";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { apiRequest } from "@/lib/api";
import { WalletBalanceCard } from "./WalletBalanceCard";
import { WalletTransactionList, WalletTransaction } from "./WalletTransactionList";

type WalletData = {
  wallet: {
    id: number;
    balance_cents: number;
  };
};

export function WalletClient() {
  const [wallet, setWallet] = useState<WalletData["wallet"] | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [balanceResponse, transactionsResponse] = await Promise.all([
        apiRequest<WalletData>("/api/wallet/balance"),
        apiRequest<{ transactions: WalletTransaction[] }>(
          "/api/wallet/transactions",
        ),
      ]);
      setWallet(balanceResponse.data.wallet);
      setTransactions(transactionsResponse.data.transactions);
      setError(null);
    } catch (caught) {
      setError(caught);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  if (isLoading) {
    return (
      <RouteGuard>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6">
          <AccountNav />
          <LoadingState label="Carregando carteira..." />
        </div>
      </RouteGuard>
    );
  }

  if (error) {
    return (
      <RouteGuard>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6">
          <AccountNav />
          <ErrorAlert error={error} />
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        <AccountNav />
        
        <div className="max-w-md">
          <WalletBalanceCard 
            balanceCents={wallet?.balance_cents} 
            showActions={true}
          />
        </div>

        <WalletTransactionList transactions={transactions} />
      </div>
    </RouteGuard>
  );
}
