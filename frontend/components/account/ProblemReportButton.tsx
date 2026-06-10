import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProblemReportButtonProps {
  saleId: string | number;
}

export function ProblemReportButton({ saleId }: ProblemReportButtonProps) {
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_URL || "https://wa.me/55XXXXXXXXXXX";
  const message = encodeURIComponent(`Olá, estou com um problema na compra #${saleId} na Vending Machine.`);
  
  return (
    <Button asChild variant="outline" className="w-full">
      <a href={`${whatsappUrl}?text=${message}`} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="mr-2 h-4 w-4" />
        Relatar problema pelo WhatsApp
      </a>
    </Button>
  );
}
