import {
  Clock3,
  Headphones,
  History,
  RadioTower,
  SearchCheck,
  Wallet,
} from "lucide-react";

const features = [
  { title: "Compra pelo celular", description: "Acesse o catalogo pelo QR Code ou pela lista de maquinas.", icon: Clock3 },
  { title: "Saldo pre-pago", description: "Recarregue sua carteira e acompanhe o valor disponivel.", icon: Wallet },
  { title: "Historico de compras", description: "Consulte pedidos anteriores e status de retirada.", icon: History },
  { title: "Maquinas conectadas", description: "A experiencia web conversa com equipamentos fisicos preparados para IoT.", icon: RadioTower },
  { title: "Disponibilidade visivel", description: "Veja produtos e slots antes de iniciar a compra.", icon: SearchCheck },
  { title: "Suporte rapido", description: "Abra o atendimento por WhatsApp em caso de problema.", icon: Headphones },
];

export function FeatureCards() {
  return (
    <section className="flex flex-col gap-5 py-6">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight">Beneficios</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Uma jornada simples para clientes e uma operacao mais organizada para
          quem administra as maquinas.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.title} className="rounded-lg border bg-card p-4">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {feature.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
