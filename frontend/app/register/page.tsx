import Link from "next/link";

import { RegisterForm } from "@/components/forms/AuthForms";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10">
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground">
        Ja tem conta?{" "}
        <Link className="font-medium text-foreground underline" href="/login">
          Entrar
        </Link>
      </p>
    </main>
  );
}
