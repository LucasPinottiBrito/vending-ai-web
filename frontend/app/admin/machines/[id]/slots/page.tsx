import { SlotsAdmin } from "@/components/admin/SlotsAdmin";

export default async function MachineSlotsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SlotsAdmin machineId={id} />;
}
