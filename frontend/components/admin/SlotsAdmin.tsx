"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  Edit,
  MoreVertical,
  Plus,
  Trash2,
  Cpu,
} from "lucide-react";

import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingState } from "@/components/feedback/LoadingState";
import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { slotSchema } from "@/lib/validators";
import { SlotForm } from "./SlotForm";

type Slot = {
  id: number;
  machine_id: number;
  code: string;
  motor_id: number;
  sensor_column_id: number;
  is_enabled: boolean;
};

type Machine = { id: number; name: string; slug: string };

type SlotValues = z.infer<typeof slotSchema>;

export function SlotsAdmin({ machineId }: { machineId: string }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [machine, setMachine] = useState<Machine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [slotsRes, machineRes] = await Promise.all([
        apiRequest<{ slots: Slot[] }>(`/api/machines/${machineId}/slots`),
        apiRequest<{ machine: Machine }>(`/api/machines/${machineId}`),
      ]);
      setSlots(slotsRes.data.slots);
      setMachine(machineRes.data.machine);
      setError(null);
    } catch (caught) {
      setError(caught);
    } finally {
      setIsLoading(false);
    }
  }, [machineId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(values: SlotValues) {
    setIsSubmitting(true);
    try {
      await apiRequest(`/api/machines/${machineId}/slots`, {
        method: "POST",
        body: values,
      });
      toast.success("Slot criado com sucesso!");
      setIsCreateOpen(false);
      await load();
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(values: SlotValues) {
    if (!editingSlot) return;
    setIsSubmitting(true);
    try {
      await apiRequest(`/api/slots/${editingSlot.id}`, {
        method: "PUT",
        body: values,
      });
      toast.success("Slot atualizado com sucesso!");
      setEditingSlot(null);
      await load();
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja excluir este slot?")) return;
    try {
      await apiRequest(`/api/slots/${id}`, { method: "DELETE" });
      toast.success("Slot excluído");
      await load();
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    }
  }

  if (isLoading && !machine) return <AdminShell><LoadingState label="Carregando slots..." /></AdminShell>;
  if (error) return <AdminShell><ErrorAlert error={error} /></AdminShell>;

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title={`Slots - ${machine?.name || "Máquina"}`}
            description={`Configuração física de motores e sensores para a máquina ${machine?.slug}.`}
          />
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Slot
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Slot</DialogTitle>
                <DialogDescription>
                  Adicione uma nova espiral de entrega à máquina.
                </DialogDescription>
              </DialogHeader>
              <SlotForm
                onSubmit={handleCreate}
                isSubmitting={isSubmitting}
                submitLabel="Criar Slot"
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Espirais e Sensores</CardTitle>
            <CardDescription>
              Mapeamento de hardware para comandos MQTT.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Motor ID</TableHead>
                    <TableHead>Sensor Column</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slots.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Nenhum slot configurado nesta máquina.
                      </TableCell>
                    </TableRow>
                  ) : (
                    slots.map((slot) => (
                      <TableRow key={slot.id}>
                        <TableCell className="font-bold">{slot.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Cpu className="h-3 w-3 text-muted-foreground" />
                            {slot.motor_id}
                          </div>
                        </TableCell>
                        <TableCell>{slot.sensor_column_id}</TableCell>
                        <TableCell>
                          <Badge
                            variant={slot.is_enabled ? "secondary" : "outline"}
                          >
                            {slot.is_enabled ? "Habilitado" : "Desabilitado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setEditingSlot(slot)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar Configurações
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(slot.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir Slot
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!editingSlot}
        onOpenChange={(open) => !open && setEditingSlot(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Slot {editingSlot?.code}</DialogTitle>
            <DialogDescription>
              Ajuste o endereçamento de hardware.
            </DialogDescription>
          </DialogHeader>
          {editingSlot && (
            <SlotForm
              initialValues={{
                code: editingSlot.code,
                motor_id: editingSlot.motor_id,
                sensor_column_id: editingSlot.sensor_column_id,
                is_enabled: editingSlot.is_enabled,
              }}
              onSubmit={handleUpdate}
              isSubmitting={isSubmitting}
              submitLabel="Salvar Alterações"
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
