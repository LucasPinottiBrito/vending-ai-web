"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { z } from "zod";
import {
  Edit,
  MonitorCog,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  FilterX,
  Settings,
  Boxes,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, getErrorMessage } from "@/lib/api";
import { machineSchema } from "@/lib/validators";
import { MachineForm } from "./MachineForm";

type Machine = {
  id: number;
  name: string;
  slug: string;
  location: string;
  status: "ONLINE" | "OFFLINE" | "MAINTENANCE" | "ERROR" | string;
  can_sell?: boolean;
  is_active: boolean;
};

type MachineValues = z.infer<typeof machineSchema>;

export function MachinesAdmin() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [active, setActive] = useState("all");

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMachine, setEditingProduct] = useState<Machine | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (status !== "all") queryParams.append("status", status);
      if (active !== "all") queryParams.append("active", active);

      const response = await apiRequest<{ machines: Machine[] }>(
        `/api/machines?${queryParams.toString()}`,
      );
      setMachines(response.data.machines);
      setError(null);
    } catch (caught) {
      setError(caught);
    } finally {
      setIsLoading(false);
    }
  }, [search, status, active]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(values: MachineValues) {
    setIsSubmitting(true);
    try {
      await apiRequest("/api/machines", { method: "POST", body: values });
      toast.success("Máquina criada com sucesso!");
      setIsCreateOpen(false);
      await load();
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(values: MachineValues) {
    if (!editingMachine) return;
    setIsSubmitting(true);
    try {
      await apiRequest(`/api/machines/${editingMachine.id}`, {
        method: "PUT",
        body: values,
      });
      toast.success("Máquina atualizada com sucesso!");
      setEditingProduct(null);
      await load();
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja desativar esta máquina?")) return;
    try {
      await apiRequest(`/api/machines/${id}`, { method: "DELETE" });
      toast.success("Máquina desativada");
      await load();
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    }
  }

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setActive("all");
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ONLINE":
        return "secondary";
      case "MAINTENANCE":
        return "outline";
      case "ERROR":
      case "OFFLINE":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Máquinas"
            description="Gerencie as máquinas de venda automática do sistema."
          />
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Máquina
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Criar Nova Máquina</DialogTitle>
                <DialogDescription>
                  Configure uma nova unidade para a rede.
                </DialogDescription>
              </DialogHeader>
              <MachineForm
                onSubmit={handleCreate}
                isSubmitting={isSubmitting}
                submitLabel="Criar Máquina"
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros e Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Nome, Slug ou Local</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="w-[180px] space-y-2">
                <label className="text-sm font-medium">Status IoT</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ONLINE">ONLINE</SelectItem>
                    <SelectItem value="OFFLINE">OFFLINE</SelectItem>
                    <SelectItem value="MAINTENANCE">MANUTENÇÃO</SelectItem>
                    <SelectItem value="ERROR">ERRO</SelectItem>
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

        {isLoading && machines.length === 0 ? (
          <LoadingState label="Carregando máquinas..." />
        ) : error ? (
          <ErrorAlert error={error} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Máquina</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Status IoT</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {machines.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center text-muted-foreground"
                        >
                          Nenhuma máquina encontrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      machines.map((machine) => (
                        <TableRow key={machine.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{machine.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {machine.slug}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {machine.location}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(machine.status)}>
                              {machine.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={machine.is_active ? "secondary" : "destructive"}
                            >
                              {machine.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button asChild variant="ghost" size="icon" title="Configurar Slots">
                                <Link href={`/admin/machines/${machine.id}/slots`}>
                                  <Settings className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button asChild variant="ghost" size="icon" title="Ver Inventário">
                                <Link href={`/admin/inventory?machine_id=${machine.id}`}>
                                  <Boxes className="h-4 w-4" />
                                </Link>
                              </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Gerenciar</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setEditingProduct(machine)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar Dados
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDelete(machine.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Desativar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog
        open={!!editingMachine}
        onOpenChange={(open) => !open && setEditingProduct(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Máquina</DialogTitle>
            <DialogDescription>
              Altere as configurações básicas da máquina.
            </DialogDescription>
          </DialogHeader>
          {editingMachine && (
            <MachineForm
              initialValues={{
                slug: editingMachine.slug,
                name: editingMachine.name,
                location: editingMachine.location,
                status: editingMachine.status as MachineValues["status"],
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
