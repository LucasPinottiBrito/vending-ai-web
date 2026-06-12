import Link from "next/link";
import { ArrowRight, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-primary p-6 text-primary-foreground md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Pronto para comprar?
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 opacity-80">
          Encontre uma maquina disponivel, escolha seu produto e acompanhe tudo
          pela plataforma.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="secondary">
          <Link href="/catalogo">
            Ver maquinas
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="bg-transparent">
          <Link href="/account">
            <UserRound data-icon="inline-start" />
            Minha conta
          </Link>
        </Button>
      </div>
    </section>
  );
}
