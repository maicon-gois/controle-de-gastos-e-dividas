import { useState } from "react";
import { MonthDecision } from "@/lib/types";
import { ProjectedMonth } from "@/lib/projection";
import { X, PiggyBank, CheckCircle2, ArrowRight } from "lucide-react";

interface PlanMonthModalProps {
  month: ProjectedMonth;
  onSave: (decision: MonthDecision) => void;
  onClear: (monthKey: string) => void;
  onClose: () => void;
}

const brl = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export function PlanMonthModal({
  month,
  onSave,
  onClear,
  onClose,
}: PlanMonthModalProps) {
  const existingAllocation = month.allocations[0];
  const defaultDebtId =
    existingAllocation?.debtId ||
    month.priorityDebtId ||
    month.debtsSnapshot[0]?.id ||
    "";

  const [selectedDebtId, setSelectedDebtId] = useState(defaultDebtId);
  const selectedDebt = month.debtsSnapshot.find((d) => d.id === selectedDebtId);

  const suggestedPay = selectedDebt
    ? Math.min(month.available, selectedDebt.remaining)
    : 0;

  const [payAmount, setPayAmount] = useState(
    String(existingAllocation?.amount ?? Math.max(0, suggestedPay))
  );
  const [saveAmount, setSaveAmount] = useState(String(month.saved || 0));

  const pay = Math.max(
    0,
    Math.min(
      Number(payAmount) || 0,
      selectedDebt?.remaining ?? 0,
      month.available
    )
  );
  const save = Math.max(0, Math.min(Number(saveAmount) || 0, month.available - pay));
  const free = Math.max(0, month.available - pay - save);
  const debtAfter = selectedDebt ? selectedDebt.remaining - pay : 0;

  const handleSave = () => {
    const decision: MonthDecision = {
      monthKey: month.key,
      allocations: pay > 0 && selectedDebtId ? [{ debtId: selectedDebtId, amount: pay }] : [],
      saved: save,
    };
    onSave(decision);
    onClose();
  };

  const fillAllToDebt = () => {
    setPayAmount(String(Math.max(0, suggestedPay)));
    setSaveAmount("0");
  };

  const fillAllToSave = () => {
    setPayAmount("0");
    setSaveAmount(String(month.available));
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 backdrop-blur-sm safe-top"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl overflow-hidden max-h-[92dvh] sm:max-h-[90vh] flex flex-col safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Planejar {month.label}</h2>
            <p className="text-xs text-zinc-500">
              Disponível no mês:{" "}
              <span className="text-green-400 font-semibold">{brl(month.available)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Sobra fixa</p>
              <p className="text-sm font-bold text-zinc-200">{brl(month.baseSurplus)}</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Guardado ant.</p>
              <p className="text-sm font-bold text-indigo-300">{brl(month.carryIn)}</p>
            </div>
            <div className="bg-zinc-950 border border-green-900/40 rounded-xl p-3">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Disponível</p>
              <p className="text-sm font-bold text-green-400">{brl(month.available)}</p>
            </div>
          </div>

          {month.debtsSnapshot.length === 0 ? (
            <div className="text-center py-6 text-emerald-400 font-semibold flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8" />
              Todas as dívidas já estão quitadas nesta projeção!
            </div>
          ) : (
            <>
              {/* Choose debt */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Dívida prioritária a quitar
                </label>
                <select
                  value={selectedDebtId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedDebtId(id);
                    const d = month.debtsSnapshot.find((x) => x.id === id);
                    if (d) {
                      setPayAmount(
                        String(Math.max(0, Math.min(month.available - save, d.remaining)))
                      );
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 appearance-none"
                >
                  {month.debtsSnapshot.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.creditor} — resta {brl(d.remaining)}
                    </option>
                  ))}
                </select>
                {selectedDebt && (
                  <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2">
                    {selectedDebt.description}
                  </p>
                )}
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={fillAllToDebt}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  Pagar o máximo na dívida
                </button>
                <button
                  type="button"
                  onClick={fillAllToSave}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                >
                  Guardar tudo p/ próximo mês
                </button>
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Pagar na dívida (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Guardar (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={saveAmount}
                    onChange={(e) => setSaveAmount(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>
            </>
          )}

          {/* Preview */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-2 text-sm">
            <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-1">Resultado</p>
            {selectedDebt && pay > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 flex items-center gap-1">
                  {selectedDebt.creditor}
                </span>
                <span className="text-zinc-300 flex items-center gap-1">
                  {brl(selectedDebt.remaining)}
                  <ArrowRight className="w-3 h-3 text-zinc-600" />
                  <span className={debtAfter <= 0.009 ? "text-emerald-400 font-bold" : "text-white font-semibold"}>
                    {debtAfter <= 0.009 ? "QUITADA" : brl(debtAfter)}
                  </span>
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-indigo-300 flex items-center gap-1">
                <PiggyBank className="w-4 h-4" /> Vai para o próximo mês
              </span>
              <span className="text-indigo-300 font-semibold">{brl(save)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Livre (rancho / variáveis)</span>
              <span className="text-zinc-400 font-medium">{brl(free)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex gap-3">
          {month.decided && (
            <button
              type="button"
              onClick={() => {
                onClear(month.key);
                onClose();
              }}
              className="px-4 py-3 rounded-xl font-semibold text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Limpar
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
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl font-semibold text-black bg-green-500 hover:bg-green-400 transition-colors"
          >
            Confirmar plano
          </button>
        </div>
      </div>
    </div>
  );
}
