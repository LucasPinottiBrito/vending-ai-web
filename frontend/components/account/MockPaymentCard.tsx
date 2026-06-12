import { CheckCircle2, Copy, CreditCard } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";

export type PaymentData = {
  id: number;
  amount_cents: number;
  status: string;
  mock_copy_paste?: string;
};

interface MockPaymentCardProps {
  payment: PaymentData;
  onConfirm: () => void;
  isConfirming: boolean;
}

export function MockPaymentCard({
  payment,
  onConfirm,
  isConfirming,
}: MockPaymentCardProps) {
  const handleCopy = () => {
    if (payment.mock_copy_paste) {
      navigator.clipboard.writeText(payment.mock_copy_paste);
      toast.success("Codigo copiado!");
    }
  };

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <CardTitle>Recarga pronta para confirmar</CardTitle>
        </div>
        <CardDescription>
          Confirme o pagamento de demonstracao para creditar seu saldo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <p className="text-sm text-muted-foreground">Valor da recarga</p>
          <p className="text-4xl font-bold text-primary">
            {formatCurrency(payment.amount_cents)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Situacao: {payment.status}
          </p>
        </div>

        {payment.mock_copy_paste ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Codigo de pagamento da demonstracao
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-hidden text-ellipsis rounded border bg-background p-2 text-xs">
                {payment.mock_copy_paste}
              </code>
              <Button size="icon" variant="outline" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
      <CardFooter>
        <Button
          onClick={onConfirm}
          className="w-full"
          size="lg"
          disabled={isConfirming || payment.status === "PAID"}
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          {isConfirming ? "Confirmando..." : "Confirmar recarga"}
        </Button>
      </CardFooter>
    </Card>
  );
}
