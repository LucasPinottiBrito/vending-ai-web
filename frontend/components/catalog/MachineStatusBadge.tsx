import { Badge } from "@/components/ui/badge";

interface MachineStatusBadgeProps {
  status: string;
  canSell: boolean;
}

export function MachineStatusBadge({ status, canSell }: MachineStatusBadgeProps) {
  return (
    <Badge variant={canSell ? "secondary" : "destructive"}>
      {status}
    </Badge>
  );
}
