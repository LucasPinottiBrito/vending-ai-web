"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import {
  AlertTriangle,
  Boxes,
  Edit,
  Plus,
  Search,
  FilterX,
  History,
  MoreVertical,
  Minus,
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
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { inventorySchema } from "@/lib/validators";
import { InventoryForm } from "./InventoryForm";

type Inventory = {
  id: number;
  machine_id: number;
  slot_id: number;
  product_id: number;
  slot_code?: string;
  product_sku?: string;
  product_name?: string;
  machine_slug?: string;
  quantity_available: number;
  quantity_reserved: number;
  min_quantity_alert: number;
  available_for_sale: number;
};

type Machine = { id: number; name: string };

type InventoryValues = z.infer<typeof inventorySchema>;

function InventoryAdminContent() {
  const searchParams = useSearchParams();
  const initialMachineId = searchParams.get("machine_id") || "all";

  const [items, setItems] = useState<Inventory[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [machineId, setMachineId] = useState(initialMachineId);
  const [lowStockOnly, setLowStockOnly] = useState("false");

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (machineId !== "all") queryParams.append("machine_id", machineId);
      if (lowStockOnly === "true") queryParams.append("low_stock", "true");

      const [inventoryRes, machinesRes] = await Promise.all([
        apiRequest<{ inventory: Inventory[] }>(`/api/inventory?${queryParams.toString()}`),
        apiRequest<{ machines: Machine[] }>("/api/machines", { query: { active: "active" } }),
      ]);
      
      setItems(inventoryRes.data.inventory);
      setMachines(machinesRes.data.machines);
      setError(null);
    } catch (caught) {
      setError(caught);
    } finally {
      setIsLoading(false);
    }
  }, [machineId, lowStockOnly]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(values: InventoryValues) {
    setIsSubmitting(true);
    try {
      await apiRequest("/api/inventory", { method: "POST", body: values });
      toast.success("Associação de estoque criada!");
      setIsCreateOpen(false);
      await load();
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(values: InventoryValues) {
    if (!editingItem) return;
    setIsSubmitting(true);
    try {
      await apiRequest(`/api/inventory/${editingItem.id}`, {
        method: "PUT",
        body: values,
      });
      toast.success("Configurações de estoque atualizadas!");
      setEditingItem(null);
      await load();
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function adjust(id: number, delta: number) {
    try {
      await apiRequest(`/api/inventory/${id}/adjust`, {
        method: "POST",
        body: {
          quantity_available_delta: delta,
          reason: "Ajuste manual administrativo",
        },
      });
      toast.success(`Estoque ${delta > 0 ? "incrementado" : "decrementado"}!`);
      await load();
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    }
  }

  const clearFilters = () => {
    setMachineId("all");
    setLowStockOnly("false");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Inventário"
          description="Controle de estoque, alertas de reposição e associações de slots."
        />
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Estoque
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Vincular Produto ao Slot</DialogTitle>
              <DialogDescription>
                Selecione uma máquina, slot e o produto que será abastecido.
              </DialogDescription>
            </DialogHeader>
            <InventoryForm
              onSubmit={handleCreate}
              isSubmitting={isSubmitting}
              submitLabel="Criar Vínculo"
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Visibilidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Máquina</label>
              <Select value={machineId} onValueChange={setMachineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as máquinas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as máquinas</SelectItem>
                  {machines.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[200px] space-y-2">
              <label className="text-sm font-medium">Situação</label>
              <Select value={lowStockOnly} onValueChange={setLowStockOnly}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Ver Tudo</SelectItem>
                  <SelectItem value="true">Estoque Baixo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={clearFilters}>
              <FilterX className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && items.length === 0 ? (
        <LoadingState label="Carregando inventário..." />
      ) : error ? (
        <ErrorAlert error={error} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Máquina / Slot</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Disp. Real</TableHead>
                    <TableHead className="text-center">Reservado</TableHead>
                    <TableHead className="text-center">Venda (Saldo)</TableHead>
                    <TableHead className="text-right">Ajuste Rápido</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Nenhum item de inventário encontrado para estes filtros.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => {
                      const isLowStock =
                        item.quantity_available - item.quantity_reserved <=
                        item.min_quantity_alert;
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground uppercase">
                                {item.machine_slug}
                              </span>
                              <span className="font-bold">Slot {item.slot_code}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {item.product_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {item.product_sku}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {item.quantity_available}
                          </TableCell>
                          <TableCell className="text-center font-mono text-amber-600">
                            {item.quantity_reserved}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={isLowStock ? "destructive" : "secondary"}
                              className="font-mono text-sm"
                            >
                              {item.available_for_sale}
                              {isLowStock && (
                                <AlertTriangle className="ml-1 h-3 w-3" />
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => adjust(item.id, -1)}
                                disabled={item.quantity_available <= 0}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => adjust(item.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingItem(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Editar Inventário - Slot {editingItem?.slot_code}</DialogTitle>
            <DialogDescription>
              Ajuste as quantidades e limites de alerta para este item.
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <InventoryForm
              initialValues={{
                machine_id: editingItem.machine_id,
                slot_id: editingItem.slot_id,
                product_id: editingItem.product_id,
                quantity_available: editingItem.quantity_available,
                quantity_reserved: editingItem.quantity_reserved,
                min_quantity_alert: editingItem.min_quantity_alert,
              }}
              onSubmit={handleUpdate}
              isSubmitting={isSubmitting}
              submitLabel="Salvar Configurações"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function InventoryAdmin() {
  return (
    <AdminShell>
      <Suspense fallback={<LoadingState label="Carregando..." />}>
        <InventoryAdminContent />
      </Suspense>
    </AdminShell>
  );
}
