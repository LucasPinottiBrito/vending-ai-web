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
            <CardTitle>{name || "Maquina"}</CardTitle>
            <CardDescription>{location || "Localizacao nao informada"}</CardDescription>
            <p className="mt-2 text-sm text-muted-foreground">
              Produtos disponiveis nesta maquina
            </p>
          </div>
          <MachineStatusBadge status={status} canSell={canSell} />
        </div>
      </CardHeader>
    </Card>
  );
}
