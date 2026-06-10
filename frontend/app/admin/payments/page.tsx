import { PendingAdminPage } from "@/components/admin/PendingAdminPage";

export default function AdminPaymentsPage() {
  return (
    <PendingAdminPage
      title="Pagamentos"
      description="O backend atual permite consultar pagamento por ID, mas ainda nao expoe listagem administrativa."
    />
  );
}
