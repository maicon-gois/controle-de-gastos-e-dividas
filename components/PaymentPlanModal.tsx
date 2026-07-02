import { useState } from "react";
import { Debt, PaymentPlan } from "@/lib/types";
import { monthKeyOf, monthLabelOf } from "@/lib/projection";
import { X, ArrowRight, CalendarCheck } from "lucide-react";

interface PaymentPlanModalProps {
  debts: Debt[];
  startYear: number;
  startMonth: number;
  editingPlan?: PaymentPlan | null;
  onSave: (plan: Omit<PaymentPlan, "id">) => void;
  onClose: () => void;
}

const brl = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export function PaymentPlanModal({
  debts,
  startYear,
  startMonth,
  editingPlan,
  onSave,
  onClose,
}: PaymentPlanModalProps) {
  // dívidas ativas (não descontadas em folha, não pagas)
  const activeDebts = debts.filter(
    (d) => d.status === "atrasada" || d.status === "em_negociacao"
  );

  const [debtId, setDebtId] = useState(
    editingPlan?.debtId || activeDebts[0]?.id || ""
  );
  const selectedDebt = activeDebts.find((d) => d.id === debtId);

  const [label, setLabel] = useState(
    editingPlan?.label ||
      (selectedDebt ? `Plano de quitação ${selectedDebt.creditor}` : "Plano de quitação")
  );
  const [totalAmount, setTotalAmount] = useState(
    String(editingPlan?.totalAmount ?? selectedDebt?.amount ?? 0)
  );
  const [monthlyAmount, setMonthlyAmount] = useState(
    String(editingPlan?.monthlyAmount ?? "")
  );
  const [startMonthKey, setStartMonthKey] = useState(
    editingPlan?.startMonthKey || monthKeyOf(startYear, startMonth)
  );

  const total = Number(totalAmount) || 0;
  const monthly = Number(monthlyAmount) || 0;
  const monthsToClear = monthly > 0 ? Math.ceil(total / monthly) : 0;

  const handleDebtChange = (id: string) => {
    setDebtId(id);
    const d = activeDebts.find((x) => x.id === id);
    if (d) {
      setLabel(`Plano de quitação ${d.creditor}`);
      setTotalAmount(String(d.amount));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || monthly <= 0 || total <= 0) return;
    onSave({
      label,
      debtId: debtId || undefined,
      monthlyAmount: monthly,
      totalAmount: total,
      startMonthKey,
    });
    onClose();
  };

  // opções de mês de início: próximos 12 a partir do selecionado
  const monthOptions = Array.from({ length: 12 }).map((_, i) => {
    let y = startYear;
    let m = startMonth + i;
    while (m > 12) {
      m -= 12;
      y++;
    }
    return { key: monthKeyOf(y, m), label: monthLabelOf(y, m) };
  });

  // preview de quitação
  let clearLabel = "—";
  if (monthly > 0 && monthOptions.length > 0) {
    const startIdx = monthOptions.findIndex((o) => o.key === startMonthKey);
    const idx = (startIdx < 0 ? 0 : startIdx) + monthsToClear - 1;
    let y = startYear;
    let m = startMonth + (idx);
    while (m > 12) {
      m -= 12;
      y++;
    }
    clearLabel = monthLabelOf(y, m);
  }

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
            {editingPlan ? "Editar plano" : "Novo plano de quitação"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
          {activeDebts.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Dívida
              </label>
              <select
                value={debtId}
                onChange={(e) => handleDebtChange(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
              >
                {activeDebts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.creditor} — {brl(d.amount)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Nome do plano
            </label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="Ex: Plano de quitação Fiesta"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Valor por mês
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="1200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Total a quitar
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Começar em
            </label>
            <select
              value={startMonthKey}
              onChange={(e) => setStartMonthKey(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
            >
              {monthOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Linha em cada mês</span>
              <span className="text-emerald-400 font-semibold">{brl(monthly)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Duração estimada</span>
              <span className="text-white font-semibold">
                {monthsToClear > 0 ? `${monthsToClear} ${monthsToClear === 1 ? "mês" : "meses"}` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-zinc-800 pt-2">
              <span className="text-zinc-400 flex items-center gap-1">
                <CalendarCheck className="w-4 h-4 text-emerald-500" /> Quita em
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ArrowRight className="w-3 h-3" /> {clearLabel}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl font-semibold text-black bg-emerald-500 hover:bg-emerald-400 transition-colors"
            >
              {editingPlan ? "Salvar" : "Criar plano"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
