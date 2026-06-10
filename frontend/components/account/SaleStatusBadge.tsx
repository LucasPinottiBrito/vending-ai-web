import { Badge } from "@/components/ui/badge";

interface SaleStatusBadgeProps {
  status: string;
}

export function SaleStatusBadge({ status }: SaleStatusBadgeProps) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    CREATED: { label: "Criada", variant: "outline" },
    AUTHORIZED: { label: "Autorizada", variant: "secondary" },
    DISPENSING: { label: "Dispensando...", variant: "default" },
    DISPENSED: { label: "Entregue", variant: "default" },
    FAILED: { label: "Falha", variant: "destructive" },
    REFUNDED: { label: "Estornada", variant: "outline" },
  };

  const config = statusConfig[status] || { label: status, variant: "outline" };

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
