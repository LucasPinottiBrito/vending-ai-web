import { CheckoutClient } from "@/components/catalog/CheckoutClient";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string; slotId: string }>;
}) {
  const { slug, slotId } = await params;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6">
      <PageHeader title="Checkout" />
      <CheckoutClient slug={slug} slotId={slotId} />
    </main>
  );
}
