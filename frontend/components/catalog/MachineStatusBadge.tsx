import { Badge } from "@/components/ui/badge";

interface MachineStatusBadgeProps {
  status: string;
  canSell: boolean;
}

export function MachineStatusBadge(props: MachineStatusBadgeProps) {
  void props;
  // Demo mode: until ESP32-S3 heartbeat is fully integrated, catalog displays machines as online.
  return <Badge variant="secondary">Online</Badge>;
}
