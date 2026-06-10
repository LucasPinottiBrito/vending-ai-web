"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AccountNav } from "@/components/layout/AccountNav";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { TopupForm } from "./TopupForm";
import { MockPaymentCard, PaymentData } from "./MockPaymentCard";

export function TopupClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [payment, setPayment] = useState<PaymentData | null>(null);

  async function handleCreateTopup(values: { amount_cents: number }) {
    setIsLoading(true);
    try {
      const response = await apiRequest<{ payment: PaymentData }>(
        "/api/wallet/topup/mock",
        {
          method: "POST",
          body: values,
        }
      );
      setPayment(response.data.payment);
      toast.success("Pagamento mock gerado com sucesso!");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmPayment() {
    if (!payment) return;
    
    setIsConfirming(true);
    try {
      await apiRequest(`/api/payments/${payment.id}/confirm-mock`, {
        method: "POST",
      });
      
      toast.success("Pagamento confirmado! Saldo creditado.");
      router.push("/account/wallet");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <RouteGuard>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
        <AccountNav />
        
        {!payment ? (
          <TopupForm onSubmit={handleCreateTopup} isLoading={isLoading} />
        ) : (
          <div className="flex flex-col gap-4">
            <MockPaymentCard 
              payment={payment} 
              onConfirm={handleConfirmPayment} 
              isConfirming={isConfirming} 
            />
            <button 
              onClick={() => setPayment(null)}
              className="text-sm text-muted-foreground hover:underline"
            >
              Cancelar e voltar
            </button>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
