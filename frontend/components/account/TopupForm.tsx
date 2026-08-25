import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/formatters";

type TopupValues = {
  amount_cents: number;
};

interface TopupFormProps {
  onSubmit: (values: TopupValues) => void;
  isLoading: boolean;
}

function centsFromInput(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function TopupForm({ onSubmit, isLoading }: TopupFormProps) {
  const [amountCents, setAmountCents] = useState(2500);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (amountCents < 100) {
      setError("Valor minimo de recarga e R$ 1,00.");
      return;
    }

    onSubmit({ amount_cents: amountCents });
  }

  function handleAmountChange(value: string) {
    setAmountCents(centsFromInput(value));
    setError("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recarregar saldo</CardTitle>
        <CardDescription>
          Informe o valor em reais que deseja adicionar a sua carteira
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount_display">Valor em reais</Label>
            <Input
              id="amount_display"
              type="text"
              inputMode="numeric"
              placeholder="R$ 0,00"
              value={formatCurrency(amountCents)}
              onChange={(event) => handleAmountChange(event.target.value)}
              disabled={isLoading}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <p className="text-xs text-muted-foreground">
              Digite os numeros do valor. Exemplo: 1234 vira R$ 12,34.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Preparando recarga..." : "Gerar recarga de demonstracao"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
