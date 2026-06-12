import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import { topupSchema } from "@/lib/validators";

type TopupInput = z.input<typeof topupSchema>;
type TopupValues = z.output<typeof topupSchema>;

interface TopupFormProps {
  onSubmit: (values: TopupValues) => void;
  isLoading: boolean;
}

export function TopupForm({ onSubmit, isLoading }: TopupFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TopupInput, unknown, TopupValues>({
    resolver: zodResolver(topupSchema),
    defaultValues: { amount_cents: 2500 },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recarregar saldo</CardTitle>
        <CardDescription>
          Informe o valor que deseja adicionar a sua carteira
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount_cents">Valor em centavos</Label>
            <Input
              id="amount_cents"
              type="number"
              placeholder="Ex: 2500 para R$ 25,00"
              {...register("amount_cents", { valueAsNumber: true })}
              disabled={isLoading}
            />
            {errors.amount_cents ? (
              <p className="text-sm text-destructive">
                {errors.amount_cents.message}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Valor minimo de R$ 1,00. A confirmacao de pagamento e simulada
              nesta demonstracao.
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
