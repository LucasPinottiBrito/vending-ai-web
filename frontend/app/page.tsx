import Link from "next/link";
import { ArrowRight, LayoutDashboard, QrCode, Wallet } from "lucide-react";

import { BackendStatus } from "@/components/layout/BackendStatus";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10">
      <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div className="flex flex-col gap-5">
          <BackendStatus />
          <div className="flex flex-col gap-3">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
              Vending AI Web Platform
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground">
              Frontend Next.js conectado exclusivamente ao backend Express para
              catalogo, carteira, compras, administracao, relatorios e logs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link href="/m/hall-principal">
                <QrCode data-icon="inline-start" />
                Acessar maquina demo
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/admin">
                <LayoutDashboard data-icon="inline-start" />
                Administracao
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fluxo de compra</CardTitle>
            <CardDescription>
              O backend valida preco, saldo, estoque e autorizacao.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {["Escanear QR Code", "Entrar ou cadastrar", "Comprar com carteira"].map(
              (step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-lg border p-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium">{step}</span>
                </div>
              ),
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <QrCode />
            <CardTitle>Catalogo por maquina</CardTitle>
            <CardDescription>
              Produtos e disponibilidade carregados pelo endpoint de catalogo.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Wallet />
            <CardTitle>Carteira interna</CardTitle>
            <CardDescription>
              Saldo e recarga mockada usando endpoints do backend.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <ArrowRight />
            <CardTitle>Administracao</CardTitle>
            <CardDescription>
              CRUDs, JSON, XML, PDF e Chart.js em uma base navegavel.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </main>
  );
}
