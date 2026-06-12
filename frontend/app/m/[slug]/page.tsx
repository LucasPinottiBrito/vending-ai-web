import { CatalogClient } from "@/components/catalog/CatalogClient";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-6">
      <PageHeader
        title="Catalogo da maquina"
        description="Escolha um produto disponivel e acompanhe a compra pelo celular."
      />
      <CatalogClient slug={slug} />
    </main>
  );
}
