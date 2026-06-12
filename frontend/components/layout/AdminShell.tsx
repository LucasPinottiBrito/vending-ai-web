"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Download,
  FileText,
  LayoutDashboard,
  MonitorCog,
  Package,
  Receipt,
  ScrollText,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";

import { AdminBreadcrumbs } from "@/components/layout/AdminBreadcrumbs";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard },
  { href: "/admin/machines", label: "Maquinas", icon: MonitorCog },
  { href: "/admin/products", label: "Produtos", icon: Package },
  { href: "/admin/inventory", label: "Estoque", icon: Boxes },
  { href: "/admin/sales", label: "Vendas", icon: Receipt },
  { href: "/admin/import-export", label: "Importar / Exportar", icon: Download },
  { href: "/admin/reports", label: "Relatorios", icon: FileText },
  { href: "/admin/charts", label: "Indicadores", icon: BarChart3 },
  { href: "/admin/logs", label: "Atividades / XML", icon: ScrollText },
];

const pendingLinks = [
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/payments", label: "Pagamentos", icon: WalletCards },
  { href: "/admin/events", label: "Eventos", icon: Zap },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <RouteGuard adminOnly>
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 md:grid-cols-[240px_1fr]">
        <aside className="md:sticky md:top-20 md:self-start">
          <div className="flex flex-col gap-2 rounded-lg border bg-card p-2">
            <div className="px-2 py-1 text-sm font-medium">
              Administracao
            </div>
            <Separator />
            <nav className="flex flex-col gap-1">
              {adminLinks.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Button
                    key={item.href}
                    asChild
                    variant={active ? "secondary" : "ghost"}
                    className="justify-start"
                  >
                    <Link href={item.href}>
                      <Icon data-icon="inline-start" />
                      {item.label}
                    </Link>
                  </Button>
                );
              })}
            </nav>
            <Separator />
            <nav className="flex flex-col gap-1">
              {pendingLinks.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Button
                    key={item.href}
                    asChild
                    variant={active ? "secondary" : "ghost"}
                    className={cn("justify-start", !active && "text-muted-foreground")}
                  >
                    <Link href={item.href}>
                      <Icon data-icon="inline-start" />
                      {item.label}
                    </Link>
                  </Button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex min-w-0 flex-col gap-5">
          <AdminBreadcrumbs />
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}
