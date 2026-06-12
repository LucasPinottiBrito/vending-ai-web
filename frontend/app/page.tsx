import { AdminPreview } from "@/components/marketing/AdminPreview";
import { FeatureCards } from "@/components/marketing/FeatureCards";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { HeroSection } from "@/components/marketing/HeroSection";
import { HowItWorks } from "@/components/marketing/HowItWorks";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-6">
      <HeroSection />
      <HowItWorks />
      <FeatureCards />

      <section className="rounded-xl border bg-muted/40 p-5">
        <h2 className="text-2xl font-semibold tracking-tight">
          Uma plataforma para vending machines inteligentes
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Vending AI e uma plataforma de autoatendimento para maquinas de venda
          inteligentes. O sistema conecta usuarios, produtos, saldo digital,
          controle de estoque e maquinas fisicas em uma unica experiencia web.
        </p>
      </section>

      <AdminPreview />
      <FinalCTA />
    </main>
  );
}
