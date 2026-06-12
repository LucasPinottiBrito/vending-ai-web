import { CreditCard, PackageCheck, Smartphone, Store } from "lucide-react";

const steps = [
  { title: "Escolha a maquina", description: "Veja os pontos disponiveis para compra.", icon: Store },
  { title: "Selecione o produto", description: "Confira preco, slot e disponibilidade.", icon: Smartphone },
  { title: "Pague com saldo", description: "Use sua carteira digital dentro da plataforma.", icon: CreditCard },
  { title: "Retire na vending machine", description: "A maquina libera o item apos a confirmacao.", icon: PackageCheck },
];

export function HowItWorks() {
  return (
    <section className="flex flex-col gap-5 py-6">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight">Como funciona</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          O fluxo foi pensado para quem esta perto da maquina e quer comprar
          rapido, sem fila e com acompanhamento pelo celular.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="rounded-lg border bg-card p-4">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
