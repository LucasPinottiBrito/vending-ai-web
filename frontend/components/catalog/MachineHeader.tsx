import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/formatters";
import { MachineStatusBadge } from "./MachineStatusBadge";

interface MachineHeaderProps {
  name: string;
  location: string;
  status: string;
  canSell: boolean;
  lastSeenAt?: string | null;
}

export function MachineHeader({ name, location, status, canSell, lastSeenAt }: MachineHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>{name || "Maquina"}</CardTitle>
            <CardDescription>{location || "Localizacao nao informada"}</CardDescription>
            <p className="mt-2 text-sm text-muted-foreground">
              {canSell
                ? "Produtos disponiveis nesta maquina"
                : "Esta maquina esta bloqueada para venda ate receber um novo heartbeat."}
            </p>
            {lastSeenAt ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Ultimo heartbeat: {formatDateTime(lastSeenAt)}
              </p>
            ) : null}
          </div>
          <MachineStatusBadge status={status} canSell={canSell} />
        </div>
      </CardHeader>
    </Card>
  );
}
