import Link from "next/link";
import { ArrowRight, QrCode } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-brand-surface">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="mx-auto w-20 h-20 bg-brand-primary rounded-3xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
          <QrCode className="w-10 h-10 text-white" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Vending AI
          </h1>
          <p className="text-brand-muted">
            Escaneie o QR Code na máquina para começar sua compra.
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/m/hall-principal"
            className="inline-flex items-center justify-center w-full gap-2 px-6 py-4 text-sm font-bold text-white transition-all rounded-2xl bg-brand-primary hover:bg-brand-primary/90 active:scale-95 shadow-md shadow-brand-primary/10"
          >
            Acessar Máquina de Teste
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted/40 pt-12">
          Vending AI Web • Academic Project
        </p>
      </div>
    </main>
  );
}
