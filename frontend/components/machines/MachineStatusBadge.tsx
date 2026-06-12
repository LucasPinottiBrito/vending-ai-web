import { CircleCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type MachineStatusBadgeProps = {
  label?: string;
};

export function MachineStatusBadge({ label = "Online" }: MachineStatusBadgeProps) {
  return (
    <Badge variant="secondary" className="w-fit">
      <CircleCheck data-icon="inline-start" />
      {label}
    </Badge>
  );
}
