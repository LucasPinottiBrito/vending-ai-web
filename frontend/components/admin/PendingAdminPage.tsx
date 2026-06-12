import { PendingFeature } from "@/components/feedback/PendingFeature";
import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/layout/PageHeader";

export function PendingAdminPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <AdminShell>
      <PageHeader title={title} description={description} />
      <PendingFeature
        title="Modulo em preparacao"
        description="Esta area ja faz parte da navegacao administrativa e sera ativada quando a operacao precisar acompanhar estes dados pela interface."
      />
    </AdminShell>
  );
}
