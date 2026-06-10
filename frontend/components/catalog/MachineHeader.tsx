import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MachineStatusBadge } from "./MachineStatusBadge";

interface MachineHeaderProps {
  name: string;
  location: string;
  status: string;
  canSell: boolean;
}

export function MachineHeader({ name, location, status, canSell }: MachineHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>{name || "Máquina"}</CardTitle>
            <CardDescription>{location || "Localização não informada"}</CardDescription>
          </div>
          <MachineStatusBadge status={status} canSell={canSell} />
        </div>
      </CardHeader>
    </Card>
  );
}
