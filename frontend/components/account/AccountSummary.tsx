import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AccountSummaryProps {
  name?: string;
  email?: string;
  role?: string;
}

const roleLabels: Record<string, string> = {
  USER: "Usuario",
  ADMIN: "Administrador",
  OPERATOR: "Operador",
};

export function AccountSummary({ name, email, role }: AccountSummaryProps) {
  const roleLabel = role ? roleLabels[role] || role : "Usuario";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>Dados principais da sua conta</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Nome</p>
          <p className="font-medium">{name || "Nao informado"}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">E-mail</p>
          <p className="font-medium">{email}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Tipo de conta</p>
          <p className="font-medium">{roleLabel}</p>
        </div>
      </CardContent>
    </Card>
  );
}
