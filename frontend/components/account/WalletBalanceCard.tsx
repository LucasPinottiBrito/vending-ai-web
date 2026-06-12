import Link from "next/link";
import { PlusCircle, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";

interface WalletBalanceCardProps {
  balanceCents?: number;
  showActions?: boolean;
}

export function WalletBalanceCard({
  balanceCents,
  showActions = true,
}: WalletBalanceCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Saldo disponivel</CardTitle>
          <Wallet className="h-5 w-5 text-muted-foreground" />
        </div>
        <CardDescription>
          Use seu saldo para comprar na vending machine
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-primary">
          {balanceCents === undefined ? "---" : formatCurrency(balanceCents)}
        </p>
        {showActions ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/account/wallet">Ver historico</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/account/wallet/topup">
                <PlusCircle className="mr-2 h-4 w-4" />
                Recarregar saldo
              </Link>
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
