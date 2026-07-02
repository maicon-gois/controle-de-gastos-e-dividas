import { useState } from "react";
import { Transaction } from "@/lib/types";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { TransactionDetailModal } from "@/components/TransactionDetailModal";

interface SpreadsheetViewProps {
  transactions: Transaction[];
  onAdd: (t: Omit<Transaction, 'id' | 'date'> & { id?: string, date?: string }) => void;
  onUpdate?: (id: string, updates: Partial<Transaction>) => void;
  onRemove?: (id: string) => void;
}

export function SpreadsheetView({ transactions, onAdd, onUpdate, onRemove }: SpreadsheetViewProps) {
  const [addingRow, setAddingRow] = useState(false);
  const [newType, setNewType] = useState<"entrada" | "saida">("saida");
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const handleInlineAdd = () => {
    if (!newDesc || !newAmount || isNaN(Number(newAmount))) return;

    onAdd({
      type: newType,
      categoryId: "outros",
      description: newDesc,
      amount: Number(newAmount),
      date: new Date(newDate).toISOString(),
    });

    setNewDesc("");
    setNewAmount("");
    setAddingRow(false);
  };

  const entradas = transactions
    .filter((t) => t.type === "entrada")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const saidas = transactions
    .filter((t) => t.type === "saida")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const allDates = Array.from(new Set(transactions.map((t) => format(new Date(t.date), "yyyy-MM-dd")))).sort();

  const renderTransactionCell = (t: Transaction, colorClass: string) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setSelectedTransaction(t)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setSelectedTransaction(t);
        }
      }}
      className="w-full text-left group flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
    >
      <div>
        <span className="hover:text-white transition-colors block">{t.description}</span>
        {t.tags && t.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {t.tags.map((tag) => (
              <span
                key={tag}
                className={`text-[10px] ${colorClass} px-1.5 py-0.5 rounded-sm`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (onRemove) onRemove(t.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 text-red-500/50 hover:text-red-400 transition-opacity"
        title="Apagar Linha"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  const renderAmountCell = (t: Transaction, colorClass: string) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setSelectedTransaction(t)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setSelectedTransaction(t);
        }
      }}
      className={`w-full text-right cursor-pointer hover:opacity-80 transition-opacity ${colorClass}`}
    >
      R$ {t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
    </div>
  );

  return (
    <>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-900 border-b-2 border-zinc-700 text-xs text-zinc-400 uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold border-r border-zinc-800 w-[120px]">Data</th>
                <th className="px-4 py-3 font-semibold border-r border-zinc-800 text-green-400" colSpan={2}>
                  Entradas (R$)
                </th>
                <th className="px-4 py-3 font-semibold border-r border-zinc-800 text-red-400" colSpan={2}>
                  Saídas (R$)
                </th>
                <th className="px-4 py-3 font-semibold w-[120px]">Saldo Dia</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {allDates.map((dateString) => {
                const dateTrans = transactions.filter(
                  (t) => format(new Date(t.date), "yyyy-MM-dd") === dateString
                );
                const dayEntradas = dateTrans.filter((t) => t.type === "entrada");
                const daySaidas = dateTrans.filter((t) => t.type === "saida");
                const maxRows = Math.max(dayEntradas.length, daySaidas.length) || 1;
                const totalEntradasDia = dayEntradas.reduce((acc, curr) => acc + curr.amount, 0);
                const totalSaidasDia = daySaidas.reduce((acc, curr) => acc + curr.amount, 0);
                const saldoDia = totalEntradasDia - totalSaidasDia;

                return Array.from({ length: maxRows }).map((_, idx) => {
                  const entrada = dayEntradas[idx];
                  const saida = daySaidas[idx];
                  return (
                    <tr
                      key={`${dateString}-${idx}`}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/20"
                    >
                      <td className="px-4 py-2 border-r border-zinc-800/50 text-zinc-500 whitespace-nowrap">
                        {idx === 0 ? format(new Date(dateString), "dd/MM/yyyy") : ""}
                      </td>

                      <td className="px-4 py-2 border-r border-zinc-800/50 bg-green-500/5 text-zinc-300 w-[30%]">
                        {entrada
                          ? renderTransactionCell(
                              entrada,
                              "bg-green-500/20 text-green-400"
                            )
                          : ""}
                      </td>
                      <td className="px-4 py-2 border-r border-zinc-800/50 bg-green-500/5 text-green-400 font-medium text-right w-[15%]">
                        {entrada
                          ? renderAmountCell(entrada, "text-green-400")
                          : ""}
                      </td>

                      <td className="px-4 py-2 border-r border-zinc-800/50 bg-red-500/5 text-zinc-300 w-[30%]">
                        {saida
                          ? renderTransactionCell(saida, "bg-red-500/20 text-red-400")
                          : ""}
                      </td>
                      <td className="px-4 py-2 border-r border-zinc-800/50 bg-red-500/5 text-zinc-400 text-right w-[15%]">
                        {saida
                          ? renderAmountCell(saida, "text-red-400")
                          : ""}
                      </td>

                      <td
                        className={`px-4 py-2 text-right font-medium ${
                          saldoDia >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {idx === 0
                          ? `R$ ${saldoDia.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                          : ""}
                      </td>
                    </tr>
                  );
                });
              })}

              {addingRow ? (
                <tr className="bg-zinc-800/30 border-b border-zinc-700">
                  <td className="px-2 py-2 border-r border-zinc-800/50">
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs"
                    />
                  </td>
                  <td
                    colSpan={2}
                    className={`px-2 py-2 border-r border-zinc-800/50 ${newType === "entrada" ? "bg-zinc-900/50" : "opacity-30"}`}
                  >
                    {newType === "entrada" && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Descrição Renda"
                          value={newDesc}
                          onChange={(e) => setNewDesc(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs"
                        />
                        <input
                          type="number"
                          placeholder="Valor"
                          value={newAmount}
                          onChange={(e) => setNewAmount(e.target.value)}
                          className="w-24 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs"
                        />
                      </div>
                    )}
                  </td>
                  <td
                    colSpan={2}
                    className={`px-2 py-2 border-r border-zinc-800/50 ${newType === "saida" ? "bg-zinc-900/50" : "opacity-30"}`}
                  >
                    {newType === "saida" && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Descrição Conta"
                          value={newDesc}
                          onChange={(e) => setNewDesc(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs"
                        />
                        <input
                          type="number"
                          placeholder="Valor"
                          value={newAmount}
                          onChange={(e) => setNewAmount(e.target.value)}
                          className="w-24 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs"
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2 flex items-center justify-between">
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as "entrada" | "saida")}
                      className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs mr-2"
                    >
                      <option value="saida">Saída</option>
                      <option value="entrada">Entrada</option>
                    </select>
                    <div className="flex gap-1">
                      <button
                        onClick={handleInlineAdd}
                        className="bg-green-600/20 text-green-400 hover:bg-green-600/40 px-3 py-1 rounded text-xs font-bold"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setAddingRow(false)}
                        className="bg-zinc-700 text-zinc-300 hover:bg-zinc-600 px-3 py-1 rounded text-xs"
                      >
                        X
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr
                  className="border-b border-zinc-800 hover:bg-zinc-800/20 cursor-pointer transition-colors"
                  onClick={() => setAddingRow(true)}
                >
                  <td
                    colSpan={6}
                    className="px-4 py-3 text-center text-zinc-500 font-semibold text-xs flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Adicionar nova linha
                  </td>
                </tr>
              )}

              <tr className="bg-zinc-900 border-t-2 border-zinc-700 text-sm font-bold uppercase tracking-wider">
                <td className="px-4 py-4 border-r border-zinc-800 text-zinc-300">TOTAL</td>
                <td colSpan={2} className="px-4 py-4 border-r border-zinc-800 text-right text-green-400">
                  R${" "}
                  {entradas
                    .reduce((a, b) => a + b.amount, 0)
                    .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
                <td colSpan={2} className="px-4 py-4 border-r border-zinc-800 text-right text-red-400">
                  R${" "}
                  {saidas
                    .reduce((a, b) => a + b.amount, 0)
                    .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-4 text-right text-white">
                  R${" "}
                  {(
                    entradas.reduce((a, b) => a + b.amount, 0) -
                    saidas.reduce((a, b) => a + b.amount, 0)
                  ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {selectedTransaction && onUpdate && onRemove && (
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
