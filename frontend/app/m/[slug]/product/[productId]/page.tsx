import { ProductDetailClient } from "@/components/catalog/ProductDetailClient";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6">
      <PageHeader title="Produto" />
      <ProductDetailClient slug={slug} productId={productId} />
    </main>
  );
}
