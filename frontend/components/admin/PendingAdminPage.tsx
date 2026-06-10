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
        title="Endpoint pendente no backend"
        description="A tela foi criada na navegacao, mas nao usa dados mockados nem acesso direto a banco. Ela deve ser ligada quando o backend expuser o endpoint HTTP correspondente."
      />
    </AdminShell>
  );
}
