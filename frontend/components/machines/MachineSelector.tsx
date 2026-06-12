"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingState } from "@/components/feedback/LoadingState";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import { MachineCard, MachineListItem } from "./MachineCard";

type MachineListResponse = {
  machines: MachineListItem[];
};

export function MachineSelector() {
  const [machines, setMachines] = useState<MachineListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  async function loadMachines() {
    setIsLoading(true);
    try {
      const response = await apiRequest<MachineListResponse>("/api/machines", {
        token: null,
        query: { active: "active", limit: 100 },
      });
      setMachines(response.data.machines);
      setError(null);
    } catch (caught) {
      setError(caught);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadMachines);
  }, []);

  if (isLoading) {
    return <LoadingState label="Carregando maquinas disponiveis" />;
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <ErrorAlert error={error} />
        <Button variant="outline" onClick={loadMachines} className="w-fit">
          <RefreshCw data-icon="inline-start" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (machines.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <h2 className="text-lg font-semibold">Nenhuma maquina encontrada</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Assim que uma vending machine estiver cadastrada, ela aparecera aqui
          para iniciar compras pelo celular.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {machines.map((machine) => (
        <MachineCard key={machine.id} machine={machine} />
      ))}
    </div>
  );
}
