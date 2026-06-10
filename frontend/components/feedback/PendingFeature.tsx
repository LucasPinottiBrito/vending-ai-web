import { Clock3 } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export function PendingFeature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Alert>
      <Clock3 data-icon="inline-start" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
