"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  FileCode,
  Download,
  Calendar,
  FilterX,
  Search,
  Eye,
  RefreshCw,
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  endpoint?: string;
  status_code?: number;
  ip?: string;
  timestamp: string;
  details?: any;
  error?: any;
};

export function LogsAdmin() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Filters
  const [user, setUser] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [eventType, setEventType] = useState("all");

  // Detail view
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
  }, [user, startDate, endDate, eventType]);

  useEffect(() => {
    loadLogs();
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
        filename.endsWith(".xml") ? filename : "logs-export.xml",
      );
      toast.success("XML exportado com sucesso!");
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsExporting(false);
    }
  }

  const clearFilters = () => {
    setUser("");
    setStartDate("");
    setEndDate("");
    setEventType("all");
  };

  const getEventBadgeVariant = (type: string) => {
    if (type.includes("ERROR") || type.includes("EXCEPTION") || type.includes("FAILURE")) return "destructive";
    if (type.includes("SUCCESS") || type.includes("CREATE") || type.includes("IMPORT")) return "secondary";
    return "outline";
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Auditoria (Logs)"
            description="Histórico técnico e operacional armazenado no MongoDB."
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
            <CardTitle>Filtros de Auditoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px] space-y-2">
                <label className="text-sm font-medium">Usuário ou IP</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="E-mail ou ID..."
                    className="pl-9"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
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
                    <SelectItem value="LOGIN_SUCCESS">Login Sucesso</SelectItem>
                    <SelectItem value="LOGIN_FAILURE">Login Falha</SelectItem>
                    <SelectItem value="REQUEST_ACCESS">Acesso Rota</SelectItem>
                    <SelectItem value="CREATE">Criação</SelectItem>
                    <SelectItem value="UPDATE">Atualização</SelectItem>
                    <SelectItem value="DELETE">Exclusão</SelectItem>
                    <SelectItem value="ERROR">Erro</SelectItem>
                    <SelectItem value="IMPORT_JSON">Importação JSON</SelectItem>
                    <SelectItem value="EXPORT_XML">Exportação XML</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Início</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    className="pl-9 w-[160px]"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fim</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    className="pl-9 w-[160px]"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
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
          <LoadingState label="Consultando MongoDB..." />
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
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
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
                          Nenhum registro de log encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log._id}>
                          <TableCell className="text-xs whitespace-nowrap">
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
                          <TableCell className="max-w-[200px] truncate text-xs font-mono">
                            {log.action || log.endpoint || "-"}
                          </TableCell>
                          <TableCell>
                            {log.status_code ? (
                              <span className={log.status_code >= 400 ? "text-destructive font-bold" : ""}>
                                {log.status_code}
                              </span>
                            ) : "-"}
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

      {/* Log Detail Dialog */}
      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              Detalhes do Log
            </DialogTitle>
            <DialogDescription>
              Dados brutos do registro no MongoDB.
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded border p-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">ID (Mongo)</p>
                  <p className="font-mono">{selectedLog._id}</p>
                </div>
                <div className="rounded border p-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Timestamp</p>
                  <p>{formatDateTime(selectedLog.timestamp)}</p>
                </div>
              </div>

              <div className="rounded bg-zinc-950 p-4 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                <pre>{JSON.stringify(selectedLog, null, 2)}</pre>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedLog(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
