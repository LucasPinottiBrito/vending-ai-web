"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  Boxes,
  Download,
  FileText,
  MonitorCog,
  Package,
  Receipt,
  ScrollText,
  TrendingUp,
  AlertTriangle,
  Activity,
} from "lucide-react";

import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiRequest } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ErrorAlert } from "@/components/feedback/ErrorAlert";

type DashboardSummary = {
  total_sales: number;
  total_revenue_cents: number;
  product_count: number;
  machine_count: number;
  low_stock_count: number;
  recent_failure_count: number;
};

const navigationCards = [
  {
    href: "/admin/machines",
    title: "Máquinas",
    description: "Gerenciar máquinas e slots.",
    icon: MonitorCog,
  },
  {
    href: "/admin/products",
    title: "Produtos",
    description: "Gerenciar catálogo e imagens.",
    icon: Package,
  },
  {
    href: "/admin/inventory",
    title: "Inventário",
    description: "Controle de estoque e alertas.",
    icon: Boxes,
  },
  {
    href: "/admin/sales",
    title: "Vendas",
    description: "Histórico e status de vendas.",
    icon: Receipt,
  },
  {
    href: "/admin/reports",
    title: "Relatórios",
    description: "Gerar PDFs de vendas.",
    icon: FileText,
  },
  {
    href: "/admin/charts",
    title: "Gráficos",
    description: "Análise visual de desempenho.",
    icon: BarChart3,
  },
];

export function AdminDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    apiRequest<DashboardSummary>("/api/admin/dashboard/summary")
      .then((res) => setSummary(res.data))
      .catch((err) => setError(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <AdminShell>
        <LoadingState label="Carregando resumo do dashboard..." />
      </AdminShell>
    );
  }

  if (error) {
    return (
      <AdminShell>
        <ErrorAlert error={error} />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <PageHeader
        title="Painel Administrativo"
        description="Visão geral da plataforma e atalhos de gerenciamento."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendas Totais</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_sales}</div>
            <p className="text-xs text-muted-foreground">Volume acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.total_revenue_cents || 0)}</div>
            <p className="text-xs text-muted-foreground">Receita bruta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Máquinas Ativas</CardTitle>
            <MonitorCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.machine_count}</div>
            <p className="text-xs text-muted-foreground">No ecossistema</p>
          </CardContent>
        </Card>

        <Card className={summary?.low_stock_count ? "border-amber-500/50 bg-amber-500/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estoque Baixo</CardTitle>
            <AlertTriangle className={cn("h-4 w-4", summary?.low_stock_count ? "text-amber-500" : "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.low_stock_count}</div>
            <p className="text-xs text-muted-foreground">Itens abaixo do mínimo</p>
          </CardContent>
        </Card>

        <Card className={summary?.recent_failure_count ? "border-destructive/50 bg-destructive/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Falhas Recentes</CardTitle>
            <AlertCircle className={cn("h-4 w-4", summary?.recent_failure_count ? "text-destructive" : "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.recent_failure_count}</div>
            <p className="text-xs text-muted-foreground">Nas últimas 24 horas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.product_count}</div>
            <p className="text-xs text-muted-foreground">Cadastrados e ativos</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-6 mb-4 text-lg font-semibold">Módulos de Gerenciamento</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {navigationCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link key={card.href} href={card.href}>
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardHeader>
                  <Icon className="mb-2 h-5 w-5" />
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </AdminShell>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
