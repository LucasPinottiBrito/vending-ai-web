import { PendingAdminPage } from "@/components/admin/PendingAdminPage";

export default function AdminUsersPage() {
  return (
    <PendingAdminPage
      title="Usuarios"
      description="A especificacao pede admin users, mas o backend atual ainda nao expoe /api/admin/users."
    />
  );
}
