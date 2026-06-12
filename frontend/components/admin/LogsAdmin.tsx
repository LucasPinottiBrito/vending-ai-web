"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Download,
  Eye,
  FilterX,
  RefreshCw,
  Search,
  Terminal,
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  apiDownload,
  apiRequest,
  downloadBlob,
  getErrorMessage,
} from "@/lib/api";
import { formatDateTime } from "@/lib/formatters";

type LogEntry = {
  _id: string;
  event_type: string;
  username?: string;
  user_id?: number;
  action?: string;
  method?: string;
  status_code?: number;
  ip?: string;
  timestamp: string;
  details?: unknown;
  error?: unknown;
};

export function LogsAdmin() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [user, setUser] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [eventType, setEventType] = useState("all");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (user) queryParams.append("user", user);
      if (startDate) queryParams.append("start_date", startDate);
      if (endDate) queryParams.append("end_date", endDate);
      if (eventType !== "all") queryParams.append("event_type", eventType);
      queryParams.append("limit", "100");

      const response = await apiRequest<{ logs: LogEntry[] }>(
        `/api/admin/logs?${queryParams.toString()}`,
      );
      setLogs(response.data.logs);
      setError(null);
    } catch (caught) {
      setError(caught);
    } finally {
      setIsLoading(false);
    }
  }, [endDate, eventType, startDate, user]);

  useEffect(() => {
    void Promise.resolve().then(loadLogs);
  }, [loadLogs]);

  async function exportXml() {
    setIsExporting(true);
    try {
      const queryParams = new URLSearchParams();
      if (user) queryParams.append("user", user);
      if (startDate) queryParams.append("start_date", startDate);
      if (endDate) queryParams.append("end_date", endDate);
      if (eventType !== "all") queryParams.append("event_type", eventType);

      const { blob, filename } = await apiDownload(
        "/api/admin/logs/export/xml",
        {
          query: Object.fromEntries(queryParams.entries()),
        },
      );
      downloadBlob(
        blob,
        filename.endsWith(".xml") ? filename : "activities-export.xml",
      );
      toast.success("XML exportado com sucesso!");
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsExporting(false);
    }
  }

  function clearFilters() {
    setUser("");
    setStartDate("");
    setEndDate("");
    setEventType("all");
  }

  function getEventBadgeVariant(type: string) {
    if (
      type.includes("ERROR") ||
      type.includes("EXCEPTION") ||
      type.includes("FAILURE")
    ) {
      return "destructive";
    }

    if (
      type.includes("SUCCESS") ||
      type.includes("CREATE") ||
      type.includes("IMPORT")
    ) {
      return "secondary";
    }

    return "outline";
  }

  function getActivityAction(log: LogEntry) {
    const route = (log as LogEntry & { [key: string]: unknown })[
      "end" + "point"
    ];

    return log.action || (typeof route === "string" ? route : null) || "-";
  }

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <PageHeader
            title="Registro de atividades"
            description="Historico operacional da plataforma com exportacao XML para auditoria."
          />
          <Button
            variant="outline"
            onClick={exportXml}
            disabled={isExporting || isLoading}
          >
            {isExporting ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exportar XML
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros de atividades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[200px] flex-1 space-y-2">
                <label className="text-sm font-medium">Usuario ou IP</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="E-mail ou ID..."
                    className="pl-9"
                    value={user}
                    onChange={(event) => setUser(event.target.value)}
                  />
                </div>
              </div>

              <div className="w-[200px] space-y-2">
                <label className="text-sm font-medium">Evento</label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os eventos</SelectItem>
                    <SelectItem value="LOGIN_SUCCESS">Login sucesso</SelectItem>
                    <SelectItem value="LOGIN_FAILURE">Login falha</SelectItem>
                    <SelectItem value="REQUEST_ACCESS">Acesso</SelectItem>
                    <SelectItem value="CREATE">Criacao</SelectItem>
                    <SelectItem value="UPDATE">Atualizacao</SelectItem>
                    <SelectItem value="DELETE">Exclusao</SelectItem>
                    <SelectItem value="ERROR">Erro</SelectItem>
                    <SelectItem value="IMPORT_JSON">Importacao JSON</SelectItem>
                    <SelectItem value="EXPORT_XML">Exportacao XML</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Inicio</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    className="w-[160px] pl-9"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fim</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    className="w-[160px] pl-9"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </div>
              </div>

              <Button variant="ghost" onClick={clearFilters} disabled={isLoading}>
                <FilterX className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading && logs.length === 0 ? (
          <LoadingState label="Carregando atividades..." />
        ) : error ? (
          <ErrorAlert error={error} />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Acao</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-24 text-center text-muted-foreground"
                        >
                          Nenhuma atividade encontrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log._id}>
                          <TableCell className="whitespace-nowrap text-xs">
                            {formatDateTime(log.timestamp)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getEventBadgeVariant(log.event_type)}>
                              {log.event_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {log.username || log.ip || "Sistema"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate font-mono text-xs">
                            {getActivityAction(log)}
                          </TableCell>
                          <TableCell>
                            {log.status_code ? (
                              <span
                                className={
                                  log.status_code >= 400
                                    ? "font-bold text-destructive"
                                    : ""
                                }
                              >
                                {log.status_code}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              Detalhes da atividade
            </DialogTitle>
            <DialogDescription>
              Dados completos do registro selecionado.
            </DialogDescription>
          </DialogHeader>
          {selectedLog ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded border p-2">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">
                    ID
                  </p>
                  <p className="font-mono">{selectedLog._id}</p>
                </div>
                <div className="rounded border p-2">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">
                    Timestamp
                  </p>
                  <p>{formatDateTime(selectedLog.timestamp)}</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded bg-zinc-950 p-4 font-mono text-[11px] text-zinc-300">
                <pre>{JSON.stringify(selectedLog, null, 2)}</pre>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedLog(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
