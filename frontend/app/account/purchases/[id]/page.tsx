import { PurchaseStatusClient } from "@/components/account/PurchaseStatusClient";

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PurchaseStatusClient id={id} />;
}
