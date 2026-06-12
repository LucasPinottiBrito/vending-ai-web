import Link from "next/link";
import { MapPin, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MachineStatusBadge } from "./MachineStatusBadge";

export type MachineListItem = {
  id: number;
  name?: string;
  slug: string;
  location?: string | null;
  status?: string;
  is_active?: boolean | number;
};

export function MachineCard({ machine }: { machine: MachineListItem }) {
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
          <MachineStatusBadge />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Produtos disponiveis para consulta e compra nesta vending machine.
        </p>
        <Button asChild className="w-full">
          <Link href={`/m/${machine.slug}`}>
            <ShoppingBag data-icon="inline-start" />
            Comprar nesta maquina
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
