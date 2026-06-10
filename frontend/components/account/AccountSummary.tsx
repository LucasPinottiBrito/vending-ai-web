import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AccountSummaryProps {
  name?: string;
  email?: string;
  role?: string;
}

export function AccountSummary({ name, email, role }: AccountSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil do Usuário</CardTitle>
        <CardDescription>Dados básicos da sua conta</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Nome</p>
          <p className="font-medium">{name || "Não informado"}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">E-mail</p>
          <p className="font-medium">{email}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Cargo/Nível</p>
          <p className="font-medium capitalize">{role?.toLowerCase()}</p>
        </div>
      </CardContent>
    </Card>
  );
}
