import { MinusCircle, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";

export type WalletTransaction = {
  id: number;
  type: "CREDIT" | "DEBIT" | "REFUND" | "ADJUSTMENT" | string;
  amount_cents: number;
  status: string;
  reference_type?: string;
  description?: string;
  created_at?: string;
};

interface WalletTransactionListProps {
  transactions: WalletTransaction[];
}

export function WalletTransactionList({ transactions }: WalletTransactionListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Transações</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">Nenhuma transação encontrada.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {t.type === "CREDIT" ? (
                        <PlusCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <MinusCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">{t.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDateTime(t.created_at)}</TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{t.reference_type || "N/A"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.status === "COMPLETED" ? "secondary" : "outline"}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${t.type === "CREDIT" ? "text-green-600" : "text-red-600"}`}>
                    {t.type === "CREDIT" ? "+" : "-"} {formatCurrency(t.amount_cents)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
