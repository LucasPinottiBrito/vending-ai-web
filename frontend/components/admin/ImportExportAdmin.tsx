"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Download,
  FileJson,
  Upload,
  Info,
  ExternalLink,
  RefreshCw,
  FileDown,
} from "lucide-react";

import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  apiDownload,
  apiUpload,
  downloadBlob,
  getErrorMessage,
} from "@/lib/api";

type Entity = "products" | "inventory";

export function ImportExportAdmin() {
  const [entity, setEntity] = useState<Entity>("products");
  const [file, setFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const exportJson = useCallback(async () => {
    setIsExporting(true);
    try {
      const { blob, filename } = await apiDownload("/api/admin/export/json", {
        query: { entity },
      });
      
      const safeFilename = filename.includes("filename=") 
        ? filename.split("filename=")[1].replace(/"/g, "")
        : `${entity}-${new Date().toISOString().split("T")[0]}.json`;

      downloadBlob(blob, safeFilename);
      toast.success(`${entity === "products" ? "Produtos" : "Inventário"} exportado com sucesso!`);
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsExporting(false);
    }
  }, [entity]);

  const validateFile = (file: File): boolean => {
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      toast.error("O arquivo deve ser um JSON válido.");
      return false;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error("O arquivo é muito grande. Limite de 2MB.");
      return false;
    }
    return true;
  };

  const importJson = useCallback(async () => {
    if (!file) {
      toast.error("Selecione um arquivo .json para importar.");
      return;
    }

    if (!validateFile(file)) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.set("file", file);

    try {
      await apiUpload("/api/admin/import/json", formData, {
        query: { entity },
      });
      toast.success("Dados importados com sucesso!");
      setFile(null);
      // Reset input manually if needed, but Next.js usually handles this
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsImporting(false);
    }
  }, [entity, file]);

  return (
    <AdminShell>
      <PageHeader
        title="Dados (JSON)"
        description="Realize operações em lote importando ou exportando arquivos JSON."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5 text-primary" />
              Exportação
            </CardTitle>
            <CardDescription>
              Baixe a base de dados atual em formato JSON legível.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Entidade para Exportar</label>
              <Select value={entity} onValueChange={(val) => setEntity(val as Entity)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="products">Produtos (Catálogo)</SelectItem>
                  <SelectItem value="inventory">Inventário (Estoque)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Alert className="bg-muted/50">
              <Info className="h-4 w-4" />
              <AlertTitle className="text-xs uppercase font-bold">Dica</AlertTitle>
              <AlertDescription className="text-xs">
                A exportação gera um arquivo contendo todos os registros ativos e inativos da entidade selecionada.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button 
              className="w-full" 
              variant="secondary"
              onClick={exportJson} 
              disabled={isExporting}
            >
              {isExporting ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Exportar para JSON
            </Button>
          </CardFooter>
        </Card>

        {/* Import Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Importação
            </CardTitle>
            <CardDescription>
              Envie um arquivo JSON para atualizar ou inserir novos registros.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Entidade de Destino</label>
              <Select value={entity} onValueChange={(val) => setEntity(val as Entity)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="products">Produtos (Catálogo)</SelectItem>
                  <SelectItem value="inventory">Inventário (Estoque)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Arquivo JSON</label>
              <Input
                type="file"
                accept=".json,application/json"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground font-medium">Arquivos de exemplo:</p>
              <div className="flex gap-2">
                <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                  <a 
                    href="https://github.com/vending-ai/vending-ai-web/blob/main/docs/examples/products-import.example.json" 
                    target="_blank" 
                    rel="noreferrer"
                  >
                    Exemplo de Produtos <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
                <span className="text-muted-foreground">•</span>
                <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                  <a 
                    href="https://github.com/vending-ai/vending-ai-web/blob/main/docs/examples/inventory-import.example.json" 
                    target="_blank" 
                    rel="noreferrer"
                  >
                    Exemplo de Inventário <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button 
              className="w-full" 
              onClick={importJson} 
              disabled={isImporting || !file}
            >
              {isImporting ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileJson className="mr-2 h-4 w-4" />
              )}
              {isImporting ? "Processando..." : "Importar Arquivo"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="mt-6 border-amber-500/20 bg-amber-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-amber-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Atenção às Regras de Importação
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-amber-800 space-y-2">
          <p>• O sistema valida se o SKU do produto já existe antes de importar.</p>
          <p>• Para o Inventário, é obrigatório que os IDs de Máquina, Slot e Produto sejam válidos.</p>
          <p>• Importações malformadas serão rejeitadas integralmente (transacional).</p>
        </CardContent>
      </Card>
    </AdminShell>
  );
}

function AlertTriangle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
