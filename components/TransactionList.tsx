"use client";

import { useState } from "react";
import { Transaction } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import { TransactionDetailModal } from "@/components/TransactionDetailModal";

interface TransactionListProps {
  transactions: Transaction[];
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
}

export function TransactionList({
  transactions,
  onRemove,
  onUpdate,
}: TransactionListProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const entradas = transactions.filter((t) => t.type === "entrada");
  const saidas = transactions.filter((t) => t.type === "saida");

  const renderList = (list: Transaction[]) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-12 text-zinc-500">
          Nenhuma transação encontrada.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {list.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTransaction(t)}
            className="w-full flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800/50 hover:border-zinc-700 transition-all cursor-pointer text-left group"
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-full ${
                  t.type === "entrada"
                    ? "bg-green-500/10 text-green-500"
                    : "bg-red-500/10 text-red-500"
                }`}
              >
                {t.type === "entrada" ? (
                  <ArrowUpCircle className="w-5 h-5" />
                ) : (
                  <ArrowDownCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-medium text-zinc-200 group-hover:text-white transition-colors">
                  {t.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-zinc-500">
                    {format(parseISO(t.date), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                  {t.tags && t.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      {t.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p
              className={`font-semibold ${
                t.type === "entrada" ? "text-green-500" : "text-zinc-300"
              }`}
            >
              {t.type === "entrada" ? "+" : "-"} R${" "}
              {t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <Tabs.Root defaultValue="saidas" className="w-full">
        <Tabs.List className="flex gap-2 mb-6 border-b border-zinc-800 pb-px">
          <Tabs.Trigger
            value="saidas"
            className="flex-1 pb-3 text-sm font-semibold text-zinc-400 data-[state=active]:text-red-400 data-[state=active]:border-b-2 data-[state=active]:border-red-500 transition-all hover:text-zinc-200"
          >
            Saídas ({saidas.length})
          </Tabs.Trigger>
          <Tabs.Trigger
            value="entradas"
            className="flex-1 pb-3 text-sm font-semibold text-zinc-400 data-[state=active]:text-green-400 data-[state=active]:border-b-2 data-[state=active]:border-green-500 transition-all hover:text-zinc-200"
          >
            Entradas ({entradas.length})
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="saidas" className="focus:outline-none">
          {renderList(saidas)}
        </Tabs.Content>
        <Tabs.Content value="entradas" className="focus:outline-none">
          {renderList(entradas)}
        </Tabs.Content>
      </Tabs.Root>

      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </>
  );
}
