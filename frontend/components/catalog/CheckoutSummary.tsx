import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { CatalogItem } from "./CatalogClient";

interface CheckoutSummaryProps {
  item: CatalogItem;
  machineName?: string;
  machineLocation?: string;
}

export function CheckoutSummary({ item, machineName, machineLocation }: CheckoutSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo do Pedido</CardTitle>
        <CardDescription>Confirme os detalhes antes de finalizar a compra.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-1 rounded-lg border p-4 bg-muted/30">
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Produto</p>
          <div className="flex justify-between items-start gap-2">
            <p className="font-bold text-lg">{item.product_name}</p>
            <Badge variant="outline">Slot {item.slot_code}</Badge>
          </div>
          <p className="text-2xl font-bold text-primary mt-2">
            {formatCurrency(item.price_cents)}
          </p>
        </div>

        <div className="flex flex-col gap-1 px-1">
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Máquina</p>
          <p className="font-medium">{machineName || "Carregando..."}</p>
          <p className="text-sm text-muted-foreground">{machineLocation || "..."}</p>
        </div>
      </CardContent>
    </Card>
  );
}
