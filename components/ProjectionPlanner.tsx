"use client";

import { useState } from "react";
import { Transaction, Debt, PaymentPlan } from "@/lib/types";
import { usePlans } from "@/hooks/usePlans";
import { computeProjection, monthLabelOf } from "@/lib/projection";
import { PaymentPlanModal } from "@/components/PaymentPlanModal";
import {
  Plus,
  Trash2,
  Pencil,
  CalendarCheck,
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface ProjectionPlannerProps {
  transactions: Transaction[];
  debts: Debt[];
  selectedYear: number;
  selectedMonth: number;
  userId?: string;
}

const brl = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const HORIZON = 12;

export function ProjectionPlanner({
  transactions,
  debts,
  selectedYear,
  selectedMonth,
  userId,
}: ProjectionPlannerProps) {
  const { plans, addPlan, updatePlan, removePlan } = usePlans(userId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PaymentPlan | null>(null);

  const projection = computeProjection(
    transactions,
    debts,
    plans,
    selectedYear,
    selectedMonth,
    HORIZON
  );

  const selectedMonthData = projection.months[0];
  const selectedLabel = monthLabelOf(selectedYear, selectedMonth);

  const openNew = () => {
    setEditingPlan(null);
    setModalOpen(true);
  };
  const openEdit = (plan: PaymentPlan) => {
    setEditingPlan(plan);
    setModalOpen(true);
  };
  const handleSave = (data: Omit<PaymentPlan, "id">) => {
    if (editingPlan) updatePlan(editingPlan.id, data);
    else addPlan(data);
  };

  return (
    <div className="space-y-6">
      {/* Resumo do mês selecionado */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl sm:rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-white">
            Projeção a partir de {selectedLabel}
          </h3>
        </div>

        {selectedMonthData && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Metric
              label="Entradas do mês"
              value={brl(selectedMonthData.realIncome)}
              tone="green"
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <Metric
              label="Saídas do mês"
              value={brl(selectedMonthData.realExpense)}
              tone="red"
              icon={<TrendingDown className="w-4 h-4" />}
            />
            <Metric
              label="Sobra do mês"
              value={brl(selectedMonthData.realLeftover)}
              tone={selectedMonthData.realLeftover >= 0 ? "green" : "red"}
              icon={<PiggyBank className="w-4 h-4" />}
            />
            <Metric
              label="Livre após planos"
              value={brl(selectedMonthData.free)}
              tone={selectedMonthData.free >= 0 ? "emerald" : "red"}
              icon={<CalendarCheck className="w-4 h-4" />}
            />
          </div>
        )}

        {selectedMonthData && !selectedMonthData.hasRealData && (
          <p className="mt-4 text-sm text-zinc-500 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            {selectedLabel} ainda não tem lançamentos. A sobra aparece como R$ 0,00 até você preencher as entradas e saídas do mês.
          </p>
        )}
      </div>

      {/* Planos de quitação */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl sm:rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-bold text-white">
            Planos de Quitação
          </h3>
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 transition-colors min-h-[40px]"
          >
            <Plus className="w-4 h-4" /> Novo plano
          </button>
        </div>

        {plans.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4 text-center">
            Nenhum plano ainda. Crie um plano (ex: &quot;Plano de quitação Fiesta — R$ 1.200/mês&quot;) e ele entra como uma linha em todos os meses.
          </p>
        ) : (
          <div className="space-y-3">
            {projection.plans.map((prog) => {
              const plan = plans.find((p) => p.id === prog.planId);
              if (!plan) return null;
              const pct = prog.total > 0 ? (prog.paid / prog.total) * 100 : 0;
              return (
                <div
                  key={prog.planId}
                  className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-zinc-100 truncate">{prog.label}</h4>
                        {prog.done && (
                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded shrink-0">
                            QUITADO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {brl(prog.monthlyAmount)}/mês
                        {prog.clearMonthLabel && !prog.done && (
                          <> · quita em <span className="text-emerald-400">{prog.clearMonthLabel}</span></>
                        )}
                        {prog.clearMonthLabel && prog.done && (
                          <> · quitado em <span className="text-emerald-400">{prog.clearMonthLabel}</span></>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(plan)}
                        className="p-2 text-zinc-400 hover:text-white transition-colors"
                        aria-label="Editar plano"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removePlan(plan.id)}
                        className="p-2 text-red-500/60 hover:text-red-400 transition-colors"
                        aria-label="Excluir plano"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="text-zinc-500">
                      Pago {brl(prog.paid)} de {brl(prog.total)}
                    </span>
                    <span className="text-zinc-400 font-medium">
                      Falta {brl(prog.remaining)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Timeline dos meses */}
      <div className="space-y-3">
        <h3 className="text-base sm:text-lg font-bold text-white px-1">
          Mês a mês
        </h3>
        {projection.months.map((m) => (
          <div
            key={m.key}
            className={`rounded-2xl border p-4 ${
              m.shortfall
                ? "bg-red-900/10 border-red-900/40"
                : "bg-zinc-900/50 border-zinc-800"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white">{m.label}</h4>
                {!m.hasRealData && (
                  <span className="text-[10px] text-zinc-500 border border-zinc-700 rounded px-1.5 py-0.5">
                    sem lançamentos
                  </span>
                )}
              </div>
              <span
                className={`text-sm font-bold ${
                  m.free >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                Livre: {brl(m.free)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs mb-3">
              <MiniStat label="Sobra real" value={brl(m.realLeftover)} tone={m.realLeftover >= 0 ? "green" : "red"} />
              <MiniStat label="Guardado ant." value={brl(m.carryIn)} tone="indigo" />
              <MiniStat label="Disponível" value={brl(m.available)} tone="green" />
            </div>

            {m.planLines.length > 0 && (
              <div className="space-y-1.5 border-t border-zinc-800/60 pt-3">
                {m.planLines.map((line) => (
                  <div
                    key={line.planId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-zinc-300 flex items-center gap-1.5 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate">{line.label}</span>
                      {line.quitaAqui && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </span>
                    <span className="text-red-400 font-semibold whitespace-nowrap">
                      - {brl(line.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {m.shortfall && (
              <p className="mt-3 text-xs text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                O disponível não cobre os planos deste mês. Reduza o valor mensal ou ajuste as contas.
              </p>
            )}
          </div>
        ))}
      </div>

      {modalOpen && (
        <PaymentPlanModal
          debts={debts}
          startYear={selectedYear}
          startMonth={selectedMonth}
          editingPlan={editingPlan}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: "green" | "red" | "emerald" | "indigo";
  icon?: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    green: "text-green-400",
    red: "text-red-400",
    emerald: "text-emerald-400",
    indigo: "text-indigo-300",
  };
  return (
    <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3">
      <div className="flex items-center justify-between mb-1 text-zinc-500">
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
        {icon && <span className={tones[tone]}>{icon}</span>}
      </div>
      <p className={`text-base sm:text-lg font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function MiniStat({
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
    <div className="bg-zinc-950/40 rounded-lg p-2">
      <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-0.5">{label}</p>
      <p className={`font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
}
