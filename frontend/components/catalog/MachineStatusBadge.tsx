import { CircleCheck, CircleX } from "lucide-react";

import { Badge } from "@/components/ui/badge";

interface MachineStatusBadgeProps {
  status: string;
  canSell: boolean;
}

export function MachineStatusBadge(props: MachineStatusBadgeProps) {
  const Icon = props.canSell ? CircleCheck : CircleX;

  return (
    <Badge variant={props.canSell ? "secondary" : "destructive"}>
      <Icon data-icon="inline-start" />
      {props.canSell ? "Online" : props.status === "ONLINE" ? "Sem heartbeat" : "Offline"}
    </Badge>
  );
}
