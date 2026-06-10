import { AlertCircle } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { ApiClientError } from "@/lib/api";

export function ErrorAlert({ error }: { error: unknown }) {
  const title =
    error instanceof ApiClientError ? error.code : "Erro ao carregar dados";
  const message =
    error instanceof Error
      ? error.message
      : "Nao foi possivel concluir a operacao.";

  return (
    <Alert variant="destructive">
      <AlertCircle data-icon="inline-start" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
