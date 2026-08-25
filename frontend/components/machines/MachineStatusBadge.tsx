import { CircleCheck, CircleX } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type MachineStatusBadgeProps = {
  status?: string;
  canSell?: boolean;
};

export function MachineStatusBadge({ status = "OFFLINE", canSell = false }: MachineStatusBadgeProps) {
  const Icon = canSell ? CircleCheck : CircleX;

  return (
    <Badge variant={canSell ? "secondary" : "destructive"} className="w-fit">
      <Icon data-icon="inline-start" />
      {canSell ? "Online" : status === "ONLINE" ? "Sem heartbeat" : "Offline"}
    </Badge>
  );
}
