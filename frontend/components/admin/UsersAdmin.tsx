"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { FilterX, Search, Users } from "lucide-react";

import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingState } from "@/components/feedback/LoadingState";
import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest } from "@/lib/api";
import { formatDateTime } from "@/lib/formatters";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at?: string | null;
};

function roleVariant(role: string): "default" | "secondary" | "outline" {
  if (role === "ADMIN") return "default";
  if (role === "OPERATOR") return "outline";
  return "secondary";
}

export function UsersAdmin() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [active, setActive] = useState("all");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest<{ users: AdminUser[] }>("/api/admin/users", {
        query: {
          search,
          role,
          active,
          limit: 100,
        },
      });
      setUsers(response.data.users);
      setError(null);
    } catch (caught) {
      setError(caught);
    } finally {
      setIsLoading(false);
    }
  }, [active, role, search]);

  useEffect(() => {
    startTransition(async () => {
      await load();
    });
  }, [load]);

  function clearFilters() {
    setSearch("");
    setRole("all");
    setActive("all");
  }

  return (
    <AdminShell>
      <PageHeader
        title="Usuarios"
        description="Consulte perfis, papeis e status dos usuarios da plataforma."
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Nome ou e-mail</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar usuario..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="w-full space-y-2 md:w-[170px]">
              <label className="text-sm font-medium">Papel</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="USER">Usuario</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="OPERATOR">Operador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full space-y-2 md:w-[170px]">
              <label className="text-sm font-medium">Cadastro</label>
              <Select value={active} onValueChange={setActive}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={clearFilters}>
              <FilterX data-icon="inline-start" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && users.length === 0 ? (
        <LoadingState label="Carregando usuarios..." />
      ) : error ? (
        <ErrorAlert error={error} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Nenhum usuario encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleVariant(user.role)}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "secondary" : "destructive"}>
                          {user.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(user.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </AdminShell>
  );
}
