"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export function RouteGuard({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Validando sessao...</p>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (adminOnly && !isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso administrativo necessario</CardTitle>
          <CardDescription>
            Entre com uma conta ADMIN para acessar esta area.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/account">Voltar para minha conta</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
