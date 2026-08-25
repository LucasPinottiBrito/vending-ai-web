import Link from "next/link";
import { MapPin, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MachineStatusBadge } from "./MachineStatusBadge";
import { formatDateTime } from "@/lib/formatters";

export type MachineListItem = {
  id: number;
  name?: string;
  slug: string;
  location?: string | null;
  status?: string;
  is_active?: boolean | number;
  can_sell?: boolean;
  last_seen_at?: string | null;
};

export function MachineCard({ machine }: { machine: MachineListItem }) {
  const canSell = Boolean(machine.can_sell);

  return (
    <Card className="h-full">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{machine.name || "Maquina"}</CardTitle>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{machine.location || "Localizacao nao informada"}</span>
            </div>
          </div>
          <MachineStatusBadge status={machine.status} canSell={canSell} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm leading-6 text-muted-foreground">
          {canSell
            ? "Produtos disponiveis para consulta e compra nesta vending machine."
            : "Esta maquina nao recebeu heartbeat no ultimo minuto e nao pode vender agora."}
        </p>
        {machine.last_seen_at ? (
          <p className="text-xs text-muted-foreground">
            Ultimo heartbeat: {formatDateTime(machine.last_seen_at)}
          </p>
        ) : null}
        {canSell ? (
          <Button asChild className="w-full">
            <Link href={`/m/${machine.slug}`}>
              <ShoppingBag data-icon="inline-start" />
              Comprar nesta maquina
            </Link>
          </Button>
        ) : (
          <Button className="w-full" disabled>
            <ShoppingBag data-icon="inline-start" />
            Compra indisponivel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
