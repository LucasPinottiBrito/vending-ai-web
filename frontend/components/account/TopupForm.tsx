import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    resolver: zodResolver(topupSchema) as any,
    defaultValues: { amount_cents: 2500 },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recarga de Carteira</CardTitle>
        <CardDescription>Informe o valor que deseja adicionar (em centavos)</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount_cents">Valor (Centavos)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="amount_cents"
                type="number"
                placeholder="Ex: 2500 para R$ 25,00"
                {...register("amount_cents", { valueAsNumber: true })}
                disabled={isLoading}
              />
            </div>
            {errors.amount_cents && (
              <p className="text-sm text-destructive">{errors.amount_cents.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Mínimo de R$ 1,00 (100 centavos).
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Criando pagamento..." : "Gerar Pagamento Mock"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
