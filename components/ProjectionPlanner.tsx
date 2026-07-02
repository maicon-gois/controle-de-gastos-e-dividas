"use client";

import { useState } from "react";
import { Debt, PriorityStrategy } from "@/lib/types";
import { useProjection } from "@/hooks/useProjection";
import { ProjectedMonth } from "@/lib/projection";
import { PlanMonthModal } from "@/components/PlanMonthModal";
import {
  Settings2,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  CalendarCheck,
  PiggyBank,
  CheckCircle2,
  Circle,
  RotateCcw,
} from "lucide-react";

interface ProjectionPlannerProps {
  debts: Debt[];
  userId?: string;
}

const brl = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const STRATEGY_LABELS: Record<PriorityStrategy, string> = {
  menor: "Menor valor primeiro (bola de neve)",
  oportunidade: "Oportunidades / negociação primeiro",
  maior: "Maior valor primeiro",
};

export function ProjectionPlanner({ debts, userId }: ProjectionPlannerProps) {
  const {
    assumptions,
    projection,
    updateAssumptions,
    addRecurring,
    updateRecurring,
    removeRecurring,
    updateIncome,
    setDecision,
    clearDecision,
    resetPlan,
  } = useProjection(debts, userId);

  const [showAssumptions, setShowAssumptions] = useState(false);
  const [planningMonth, setPlanningMonth] = useState<ProjectedMonth | null>(null);

  const { months, income, expenses, baseSurplus, totalActiveDebt, debtFreeMonthLabel } =
    projection;

  return (
    <div className="space-y-6">
      {/* Resumo topo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Renda fixa / mês"
          value={brl(income)}
          icon={<TrendingUp className="w-4 h-4" />}
          tone="green"
        />
        <SummaryCard
          label="Despesas fixas / mês"
          value={brl(expenses)}
          icon={<TrendingDown className="w-4 h-4" />}
          tone="red"
        />
        <SummaryCard
          label="Sobra base / mês"
          value={brl(baseSurplus)}
          icon={<PiggyBank className="w-4 h-4" />}
          tone={baseSurplus >= 0 ? "green" : "red"}
        />
        <SummaryCard
          label="Livre de dívidas em"
          value={debtFreeMonthLabel || "—"}
          icon={<CalendarCheck className="w-4 h-4" />}
          tone="emerald"
        />
      </div>

      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-zinc-400">
          Dívida ativa total (a quitar):{" "}
          <span className="text-red-400 font-bold">{brl(totalActiveDebt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetPlan}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors font-medium text-zinc-300"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Limpar plano
          </button>
          <button
            onClick={() => setShowAssumptions((v) => !v)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors font-medium text-zinc-300"
          >
            <Settings2 className="w-3.5 h-3.5" /> Premissas
            {showAssumptions ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Painel de premissas */}
      {showAssumptions && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rendas */}
            <div>
              <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">
                Renda fixa mensal
              </h4>
              <div className="space-y-2">
                {assumptions.incomes.map((inc) => (
                  <div key={inc.id} className="flex gap-2">
                    <input
                      value={inc.description}
                      onChange={(e) => updateIncome(inc.id, { description: e.target.value })}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500/50"
                    />
                    <input
                      type="number"
                      value={inc.amount}
                      onChange={(e) => updateIncome(inc.id, { amount: Number(e.target.value) })}
                      className="w-28 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-green-400 text-right focus:outline-none focus:ring-1 focus:ring-green-500/50"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Config */}
            <div>
              <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">
                Configuração
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Estratégia de prioridade</label>
                  <select
                    value={assumptions.priorityStrategy}
                    onChange={(e) =>
                      updateAssumptions({ priorityStrategy: e.target.value as PriorityStrategy })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500/50 appearance-none"
                  >
                    {(Object.keys(STRATEGY_LABELS) as PriorityStrategy[]).map((s) => (
                      <option key={s} value={s}>
                        {STRATEGY_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Horizonte (meses)</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={assumptions.horizonMonths}
                      onChange={(e) =>
                        updateAssumptions({ horizonMonths: Math.max(1, Number(e.target.value)) })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Guardado inicial (R$)</label>
                    <input
                      type="number"
                      value={assumptions.startingSaved}
                      onChange={(e) =>
                        updateAssumptions({ startingSaved: Number(e.target.value) })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Despesas fixas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Despesas fixas mensais{" "}
                <span className="text-zinc-500 normal-case font-normal">(rancho fica de fora)</span>
              </h4>
              <button
                onClick={addRecurring}
                className="flex items-center gap-1 text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {assumptions.recurring.map((r) => (
                <div key={r.id} className="flex gap-2">
                  <input
                    value={r.description}
                    onChange={(e) => updateRecurring(r.id, { description: e.target.value })}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/50"
                  />
                  <input
                    type="number"
                    value={r.amount}
                    onChange={(e) => updateRecurring(r.id, { amount: Number(e.target.value) })}
                    className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-red-400 text-right focus:outline-none focus:ring-1 focus:ring-red-500/50"
                  />
                  <button
                    onClick={() => removeRecurring(r.id)}
                    className="p-2 text-red-500/50 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Timeline de meses */}
      <div className="space-y-4">
        {months.map((m) => (
          <MonthCard key={m.key} month={m} onPlan={() => setPlanningMonth(m)} />
        ))}
      </div>

      {planningMonth && (
        <PlanMonthModal
          month={planningMonth}
          onSave={setDecision}
          onClear={clearDecision}
          onClose={() => setPlanningMonth(null)}
        />
      )}
    </div>
  );
}

function MonthCard({
  month,
  onPlan,
}: {
  month: ProjectedMonth;
  onPlan: () => void;
}) {
  const debtFree = month.remainingDebtTotal <= 0.009;

  return (
    <div
      className={`rounded-2xl border p-5 transition-all ${
        month.decided
          ? "bg-green-900/10 border-green-900/40"
          : "bg-zinc-900/50 border-zinc-800"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {month.decided ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Circle className="w-5 h-5 text-zinc-600" />
          )}
          <h3 className="text-lg font-bold text-white">{month.label}</h3>
        </div>
        <button
          onClick={onPlan}
          className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${
            month.decided
              ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              : "bg-green-500 text-black hover:bg-green-400"
          }`}
        >
          {month.decided ? "Editar plano" : "Planejar / Aceitar"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
        <Metric label="Disponível" value={brl(month.available)} tone="green" />
        <Metric label="Guardado ant." value={brl(month.carryIn)} tone="indigo" />
        <Metric label="Pago em dívida" value={brl(month.paid)} tone="red" />
        <Metric label="Guardado p/ próximo" value={brl(month.saved)} tone="indigo" />
      </div>

      {month.decided ? (
        <div className="space-y-1.5 text-sm border-t border-zinc-800/60 pt-3">
          {month.allocations.length > 0 ? (
            month.allocations.map((a) => (
              <div key={a.debtId} className="flex items-center justify-between">
                <span className="text-zinc-400">Pagamento: {a.creditor}</span>
                <span className="text-red-400 font-semibold">{brl(a.amount)}</span>
              </div>
            ))
          ) : (
            <div className="text-zinc-500">Nenhum pagamento — valor guardado.</div>
          )}
          <div className="flex items-center justify-between text-zinc-500">
            <span>Livre (rancho / variáveis)</span>
            <span>{brl(month.free)}</span>
          </div>
        </div>
      ) : debtFree ? (
        <div className="text-sm text-emerald-400 font-semibold border-t border-zinc-800/60 pt-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Dívidas quitadas — sobra livre para metas.
        </div>
      ) : (
        <div className="text-sm border-t border-zinc-800/60 pt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-zinc-400">
            Prioridade sugerida:{" "}
            <span className="text-white font-semibold">{month.priorityCreditor}</span>{" "}
            <span className="text-zinc-500">(resta {brl(month.priorityRemainingBefore)})</span>
          </span>
          {month.monthsToClearPriority != null && (
            <span className="text-xs text-zinc-500">
              ~{month.monthsToClearPriority}{" "}
              {month.monthsToClearPriority === 1 ? "mês" : "meses"} p/ quitar neste ritmo
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "green" | "red" | "emerald";
}) {
  const tones: Record<string, string> = {
    green: "text-green-400",
    red: "text-red-400",
    emerald: "text-emerald-400",
  };
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2 text-zinc-500">
        <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
        <span className={tones[tone]}>{icon}</span>
      </div>
      <div className={`text-xl font-bold ${tones[tone]}`}>{value}</div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "red" | "indigo";
}) {
  const tones: Record<string, string> = {
    green: "text-green-400",
    red: "text-red-400",
    indigo: "text-indigo-300",
  };
  return (
    <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-3">
      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
}
