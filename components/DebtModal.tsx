import { useState } from "react";
import { Debt, DebtStatus } from "@/lib/types";
import { X, Trash2 } from "lucide-react";

interface DebtModalProps {
  editingDebt?: Debt | null;
  onSave: (debt: Omit<Debt, "id" | "userId">) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: DebtStatus; label: string }[] = [
  { value: "atrasada", label: "Atrasada" },
  { value: "em_negociacao", label: "Em negociação" },
  { value: "descontado_folha", label: "Descontado em folha" },
  { value: "paga", label: "Paga" },
];

const inputClass =
  "w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/40";
const labelClass =
  "block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2";

export function DebtModal({ editingDebt, onSave, onDelete, onClose }: DebtModalProps) {
  const [creditor, setCreditor] = useState(editingDebt?.creditor || "");
  const [description, setDescription] = useState(editingDebt?.description || "");
  const [amount, setAmount] = useState(String(editingDebt?.amount ?? ""));
  const [status, setStatus] = useState<DebtStatus>(editingDebt?.status || "atrasada");
  const [interestRate, setInterestRate] = useState(
    editingDebt?.interestRate != null ? String(editingDebt.interestRate) : ""
  );
  const [minPayment, setMinPayment] = useState(
    editingDebt?.minPayment != null ? String(editingDebt.minPayment) : ""
  );
  const [strategy, setStrategy] = useState(editingDebt?.strategy || "");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!creditor.trim() || !(value > 0)) return;
    onSave({
      creditor: creditor.trim(),
      description: description.trim(),
      amount: value,
      status,
      interestRate: interestRate !== "" ? Number(interestRate) : undefined,
      minPayment: minPayment !== "" ? Number(minPayment) : undefined,
      strategy: strategy.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 backdrop-blur-sm safe-top"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {editingDebt ? "Editar dívida" : "Nova dívida"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className={labelClass}>Credor</label>
            <input
              type="text"
              required
              value={creditor}
              onChange={(e) => setCreditor(e.target.value)}
              className={inputClass}
              placeholder="Ex: Nubank, Mercado Pago, Detran"
            />
          </div>

          <div>
            <label className={labelClass}>Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              placeholder="Ex: Fatura cartão em atraso"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Valor total</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputClass}
                placeholder="1200"
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DebtStatus)}
                className={`${inputClass} appearance-none`}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Juros % ao mês</label>
              <input
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className={inputClass}
                placeholder="opcional"
              />
            </div>
            <div>
              <label className={labelClass}>Pgto mínimo/mês</label>
              <input
                type="number"
                step="0.01"
                value={minPayment}
                onChange={(e) => setMinPayment(e.target.value)}
                className={inputClass}
                placeholder="opcional"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Estratégia / observação</label>
            <textarea
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="Ex: renegociar com desconto à vista"
            />
          </div>

          <div className="flex gap-3 pt-2">
            {editingDebt && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(editingDebt.id);
                  onClose();
                }}
                className="p-3 bg-red-900/40 text-red-300 rounded-xl font-semibold hover:bg-red-900/60 transition-colors"
                aria-label="Excluir dívida"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors"
            >
              {editingDebt ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
