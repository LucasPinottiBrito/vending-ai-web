"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  PointElement,
  LineElement,
  Title,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Calendar, TrendingUp, RefreshCw } from "lucide-react";

import { ErrorAlert } from "@/components/feedback/ErrorAlert";
import { LoadingState } from "@/components/feedback/LoadingState";
import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api";
import { chartFilterSchema } from "@/lib/validators";

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend
);

type ChartResponse = {
  chart: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
    }>;
  };
};

type ChartValues = z.infer<typeof chartFilterSchema>;

export function SalesByMonthChart() {
  const [data, setData] = useState<ChartResponse["chart"] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const form = useForm<ChartValues>({
    resolver: zodResolver(chartFilterSchema) as any,
    defaultValues: { year: new Date().getFullYear() },
  });

  const load = useCallback(async (values: ChartValues) => {
    setIsLoading(true);
    try {
      const response = await apiRequest<ChartResponse>(
        "/api/admin/charts/sales-by-month",
        { query: values },
      );
      setData(response.data.chart);
      setError(null);
    } catch (caught) {
      setError(caught);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load({ year: new Date().getFullYear() });
  }, [load]);

  const chartColors = [
    "rgba(59, 130, 246, 0.8)",  // Blue (Qty)
    "rgba(16, 185, 129, 0.8)",  // Green (Revenue)
    "rgba(239, 68, 68, 0.8)",   // Red (Failures)
    "rgba(245, 158, 11, 0.8)",  // Amber (Refunds)
  ];

  return (
    <AdminShell>
      <PageHeader
        title="Análise de Desempenho"
        description="Visualize tendências de vendas, receita e indicadores operacionais por mês."
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Vendas Mensais</CardTitle>
              <CardDescription>Gráfico consolidado do ano selecionado.</CardDescription>
            </div>
            <form
              className="flex items-center gap-3"
              onSubmit={form.handleSubmit(load)}
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input 
                  id="year" 
                  type="number" 
                  className="w-[100px] h-8 text-sm" 
                  {...form.register("year")} 
                />
              </div>
              <Button type="submit" size="sm" variant="outline" disabled={isLoading}>
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Atualizar"}
              </Button>
            </form>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading && !data ? (
              <LoadingState label="Processando dados analíticos..." />
            ) : error ? (
              <ErrorAlert error={error} />
            ) : data ? (
              <div className="h-[450px] w-full">
                <Bar
                  data={{
                    labels: data.labels,
                    datasets: data.datasets.map((dataset, index) => ({
                      ...dataset,
                      backgroundColor: chartColors[index % chartColors.length],
                      borderRadius: 4,
                    })),
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "top",
                        align: "end",
                        labels: {
                          boxWidth: 12,
                          usePointStyle: true,
                          pointStyle: "circle",
                        }
                      },
                      tooltip: {
                        padding: 12,
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        titleFont: { size: 14, weight: "bold" },
                        bodyFont: { size: 13 },
                        cornerRadius: 8,
                        displayColors: true,
                      }
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                      },
                      y: {
                        beginAtZero: true,
                        grid: { color: "rgba(0, 0, 0, 0.05)" },
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <TrendingUp className="mb-4 h-10 w-10 opacity-20" />
                <p>Nenhum dado disponível para o ano selecionado.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
