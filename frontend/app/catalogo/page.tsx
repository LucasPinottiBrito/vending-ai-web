import { MachineSelector } from "@/components/machines/MachineSelector";

export default function CatalogoPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
      <section className="flex flex-col gap-2 border-b pb-5">
        <h1 className="text-3xl font-semibold tracking-tight">
          Escolha uma maquina
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Selecione a vending machine mais proxima para ver produtos
          disponiveis, consultar precos e iniciar sua compra.
        </p>
      </section>
      <MachineSelector />
    </main>
  );
}
