import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
  description: string;
  states: string[];
}

const STEPS: Step[] = [
  {
    id: "authorized",
    label: "Autorização",
    description: "Pagamento confirmado",
    states: ["AUTHORIZED", "DISPENSING", "DISPENSED", "FAILED", "REFUNDED"],
  },
  {
    id: "dispensing",
    label: "Entrega",
    description: "Máquina processando",
    states: ["DISPENSING", "DISPENSED", "FAILED", "REFUNDED"],
  },
  {
    id: "final",
    label: "Conclusão",
    description: "Retire seu produto",
    states: ["DISPENSED", "FAILED", "REFUNDED"],
  },
];

interface PurchaseStatusTimelineProps {
  currentStatus: string;
}

export function PurchaseStatusTimeline({ currentStatus }: PurchaseStatusTimelineProps) {
  const isFailed = currentStatus === "FAILED" || currentStatus === "REFUNDED";
  const isSuccess = currentStatus === "DISPENSED";

  return (
    <div className="space-y-6 py-4">
      {STEPS.map((step, index) => {
        const isActive = step.states.includes(currentStatus);
        const isCompleted = index < STEPS.length - 1 && STEPS[index + 1].states.includes(currentStatus);
        const isCurrent = isActive && !isCompleted;

        return (
          <div key={step.id} className="relative flex items-start gap-4">
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "absolute left-3 top-7 w-[2px] h-[calc(100%+8px)] bg-muted",
                  isCompleted && "bg-primary"
                )}
              />
            )}

            <div className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background">
              {isCompleted ? (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              ) : isCurrent ? (
                isFailed && step.id === "final" ? (
                  <XCircle className="h-6 w-6 text-destructive" />
                ) : (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                )
              ) : (
                <Circle className="h-6 w-6 text-muted" />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <p
                className={cn(
                  "font-medium leading-none",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.id === "final" && isFailed ? "Falha na Entrega" : step.label}
              </p>
              <p className="text-sm text-muted-foreground">
                {step.id === "final" && isFailed 
                  ? "Houve um problema ao liberar o produto" 
                  : step.id === "final" && isSuccess
                  ? "Produto liberado com sucesso!"
                  : step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
