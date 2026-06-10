import { PendingAdminPage } from "@/components/admin/PendingAdminPage";

export default function AdminEventsPage() {
  return (
    <PendingAdminPage
      title="Eventos de maquina"
      description="Eventos MQTT sao processados no backend, mas ainda nao ha rota HTTP para listagem administrativa."
    />
  );
}
