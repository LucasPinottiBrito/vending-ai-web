"use client";

import { useEffect, useState } from "react";
import { CircleCheck, CircleX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";

export function BackendStatus() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">(
    "checking",
  );

  useEffect(() => {
    let isMounted = true;

    apiRequest("/health", { token: null })
      .then(() => {
        if (isMounted) {
          setStatus("online");
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatus("offline");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === "online") {
    return (
      <Badge variant="secondary">
        <CircleCheck data-icon="inline-start" />
        API online
      </Badge>
    );
  }

  if (status === "offline") {
    return (
      <Badge variant="destructive">
        <CircleX data-icon="inline-start" />
        API offline
      </Badge>
    );
  }

  return <Badge variant="outline">Verificando API</Badge>;
}
