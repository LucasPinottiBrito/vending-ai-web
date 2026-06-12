import Link from "next/link";
import { ArrowRight, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="grid gap-8 py-8 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-14">
      <div className="flex flex-col gap-6">
        <div className="flex max-w-2xl flex-col gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            Compre na vending machine pelo celular
          </h1>
          <p className="text-base leading-7 text-muted-foreground text-pretty md:text-lg">
            Escolha uma maquina, veja os produtos disponiveis, pague com seu
            saldo e retire o item automaticamente. Uma experiencia de
            autoatendimento rapida, pratica e conectada.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/catalogo">
              Ver maquinas disponiveis
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/account">
              <WalletCards data-icon="inline-start" />
              Acessar minha conta
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="grid gap-4">
          <div className="rounded-lg bg-primary p-5 text-primary-foreground">
            <p className="text-sm opacity-80">Compra em andamento</p>
            <p className="mt-2 text-2xl font-semibold">Snack selecionado</p>
            <p className="mt-1 text-sm opacity-80">
              Confirmacao segura antes da retirada no equipamento.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p className="text-xl font-semibold">R$ 25,00</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Retirada</p>
              <p className="text-xl font-semibold">A1</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
