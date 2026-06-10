import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/components/forms/AuthForms";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando...</p>}>
        <LoginForm />
      </Suspense>
      <p className="text-center text-sm text-muted-foreground">
        Ainda nao tem conta?{" "}
        <Link className="font-medium text-foreground underline" href="/register">
          Cadastre-se
        </Link>
      </p>
    </main>
  );
}
