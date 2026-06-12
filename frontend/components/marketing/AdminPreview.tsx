import { BarChart3, Boxes, ClipboardList, MonitorCog, Package } from "lucide-react";

const adminFeatures = [
  { label: "Gerencie produtos", icon: Package },
  { label: "Acompanhe vendas", icon: ClipboardList },
  { label: "Controle estoque", icon: Boxes },
  { label: "Visualize relatorios", icon: BarChart3 },
  { label: "Monitore eventos da maquina", icon: MonitorCog },
];

export function AdminPreview() {
  return (
    <section className="grid gap-5 rounded-xl border bg-card p-5 md:grid-cols-[0.9fr_1.1fr] md:items-center">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Operacao mais clara para administradores
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          O painel administrativo organiza produtos, maquinas, estoque, vendas,
          relatorios e eventos em uma experiencia unica para a gestao diaria.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {adminFeatures.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3 rounded-lg border p-3">
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
