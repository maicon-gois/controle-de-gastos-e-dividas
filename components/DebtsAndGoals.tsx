import { Debt, Goal, PlannedPurchase, PurchasePriority } from "@/lib/types";
import {
  AlertCircle,
  Target,
  TrendingDown,
  Plus,
  Pencil,
  Swords,
  Flame,
  Mountain,
  CheckCircle2,
  Clock,
  PiggyBank,
  Trash2,
  ShoppingBag,
  RotateCcw,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo, useState } from "react";
import { DebtModal } from "@/components/DebtModal";
import { GoalModal } from "@/components/GoalModal";
import { PurchaseModal } from "@/components/PurchaseModal";
import {
  simulatePayoff,
  activePayableDebts,
  formatMonths,
  PayoffStrategy,
} from "@/lib/debt-payoff";

interface DebtsAndGoalsProps {
  debts: Debt[];
  goals: Goal[];
  plannedPurchases: PlannedPurchase[];
  onAddDebt: (debt: Omit<Debt, "id" | "userId" | "profileId">) => void;
  onUpdateDebt: (id: string, updates: Partial<Debt>) => void;
  onRemoveDebt: (id: string) => void;
  onAddGoal: (goal: Omit<Goal, "id" | "userId" | "profileId">) => void;
  onUpdateGoal: (id: string, updates: Partial<Goal>) => void;
  onRemoveGoal: (id: string) => void;
  onContributeGoal: (id: string, amount: number) => void;
  onAddPurchase: (purchase: Omit<PlannedPurchase, "id" | "userId" | "profileId">) => void;
  onUpdatePurchase: (id: string, updates: Partial<PlannedPurchase>) => void;
  onRemovePurchase: (id: string) => void;
  onContributePurchase: (id: string, amount: number) => void;
}

const brl = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const statusBadge: Record<Debt["status"], { label: string; cls: string }> = {
  atrasada: { label: "Atrasada", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  em_negociacao: { label: "Em negociação", cls: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  descontado_folha: { label: "Descontado em folha", cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  paga: { label: "Paga", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

const priorityBadge: Record<PurchasePriority, { label: string; cls: string }> = {
  alta: { label: "Alta", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  media: { label: "Média", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  baixa: { label: "Baixa", cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
};

export function DebtsAndGoals({
  debts,
  goals,
  plannedPurchases,
  onAddDebt,
  onUpdateDebt,
  onRemoveDebt,
  onAddGoal,
  onUpdateGoal,
  onRemoveGoal,
  onContributeGoal,
  onAddPurchase,
  onUpdatePurchase,
  onRemovePurchase,
  onContributePurchase,
}: DebtsAndGoalsProps) {
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PlannedPurchase | null>(null);
  const [strategy, setStrategy] = useState<PayoffStrategy>("avalanche");
  const [budget, setBudget] = useState("");
  const [contribGoalId, setContribGoalId] = useState<string | null>(null);
  const [contribValue, setContribValue] = useState("");
  const [contribPurchaseId, setContribPurchaseId] = useState<string | null>(null);
  const [contribPurchaseValue, setContribPurchaseValue] = useState("");

  const active = activePayableDebts(debts);
  const totalDebts = active.reduce((acc, d) => acc + d.amount, 0);
  const totalMin = active.reduce((acc, d) => acc + (d.minPayment ?? 0), 0);
  const debtsList = [...debts]
    .filter((d) => d.status !== "paga")
    .sort((a, b) => b.amount - a.amount);
  const paidDebts = [...debts]
    .filter((d) => d.status === "paga")
    .sort((a, b) => b.amount - a.amount);

  const revertDebt = (id: string) => onUpdateDebt(id, { status: "atrasada" });
  const revertAllPaid = () => {
    if (paidDebts.length === 0) return;
    if (confirm(`Reverter ${paidDebts.length} dívida(s) concluída(s) de volta para ativas?`)) {
      paidDebts.forEach((d) => onUpdateDebt(d.id, { status: "atrasada" }));
    }
  };

  const budgetNum = Number(budget) || 0;

  const payoff = useMemo(() => {
    if (budgetNum <= 0 || active.length === 0) return null;
    return simulatePayoff(debts, budgetNum, strategy);
  }, [debts, budgetNum, strategy, active.length]);

  const compare = useMemo(() => {
    if (budgetNum <= 0 || active.length === 0) return null;
    const av = simulatePayoff(debts, budgetNum, "avalanche");
    const sn = simulatePayoff(debts, budgetNum, "snowball");
    return { av, sn };
  }, [debts, budgetNum, active.length]);

  const openNewDebt = () => {
    setEditingDebt(null);
    setDebtModalOpen(true);
  };
  const openEditDebt = (d: Debt) => {
    setEditingDebt(d);
    setDebtModalOpen(true);
  };
  const openNewGoal = () => {
    setEditingGoal(null);
    setGoalModalOpen(true);
  };
  const openEditGoal = (g: Goal) => {
    setEditingGoal(g);
    setGoalModalOpen(true);
  };
  const openNewPurchase = () => {
    setEditingPurchase(null);
    setPurchaseModalOpen(true);
  };
  const openEditPurchase = (p: PlannedPurchase) => {
    setEditingPurchase(p);
    setPurchaseModalOpen(true);
  };

  const saveDebt = (data: Omit<Debt, "id" | "userId" | "profileId">) => {
    if (editingDebt) onUpdateDebt(editingDebt.id, data);
    else onAddDebt(data);
  };
  const saveGoal = (data: Omit<Goal, "id" | "userId" | "profileId">) => {
    if (editingGoal) onUpdateGoal(editingGoal.id, data);
    else onAddGoal(data);
  };
  const savePurchase = (data: Omit<PlannedPurchase, "id" | "userId" | "profileId">) => {
    if (editingPurchase) onUpdatePurchase(editingPurchase.id, data);
    else onAddPurchase(data);
  };

  const confirmRemoveDebt = (id: string) => {
    if (confirm("Excluir esta dívida?")) onRemoveDebt(id);
  };
  const confirmRemoveGoal = (id: string) => {
    if (confirm("Excluir esta meta?")) onRemoveGoal(id);
  };
  const confirmRemovePurchase = (id: string) => {
    if (confirm("Excluir esta compra futura?")) onRemovePurchase(id);
  };

  const submitContribution = (goalId: string) => {
    const v = Number(contribValue);
    if (v && v !== 0) onContributeGoal(goalId, v);
    setContribGoalId(null);
    setContribValue("");
  };
  const submitPurchaseContribution = (purchaseId: string) => {
    const v = Number(contribPurchaseValue);
    if (v && v !== 0) onContributePurchase(purchaseId, v);
    setContribPurchaseId(null);
    setContribPurchaseValue("");
  };

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-red-900/20 to-zinc-900/50 border border-red-900/30 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/20 text-red-400 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">Dívidas ativas</h2>
              <p className="text-sm text-zinc-400">
                {active.length} {active.length === 1 ? "dívida" : "dívidas"} · mín. {brl(totalMin)}/mês
              </p>
            </div>
          </div>
          <div className="text-4xl font-bold text-red-400">
            <span className="text-2xl font-normal text-red-500/70 mr-1">R$</span>
            {totalDebts.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-900/20 to-zinc-900/50 border border-emerald-900/30 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">Metas</h2>
              <p className="text-sm text-zinc-400">
                {goals.length} {goals.length === 1 ? "objetivo" : "objetivos"}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {goals.slice(0, 2).map((goal) => {
              const pct = goal.targetAmount > 0
                ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100)
                : 0;
              return (
                <div key={goal.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-300 truncate mr-2">{goal.title}</span>
                    <span className="text-emerald-400 font-semibold whitespace-nowrap">{Math.round(pct)}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {goals.length === 0 && <p className="text-sm text-zinc-500">Nenhuma meta ainda.</p>}
          </div>
        </div>
      </div>

      {/* Payoff strategy planner */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
        <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
          <Swords className="w-5 h-5 text-amber-400" />
          Plano de ataque às dívidas
        </h3>
        <p className="text-sm text-zinc-400 mb-4">
          Diga quanto consegue destinar por mês. O plano simula juros e mostra em quanto tempo você fica livre.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Orçamento mensal p/ dívidas
            </label>
            <input
              type="number"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              placeholder="Ex: 1500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Estratégia
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setStrategy("avalanche")}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-colors ${
                  strategy === "avalanche"
                    ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                    : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                }`}
              >
                <Mountain className="w-4 h-4" /> Avalanche
              </button>
              <button
                onClick={() => setStrategy("snowball")}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-colors ${
                  strategy === "snowball"
                    ? "bg-sky-500/15 text-sky-300 border-sky-500/40"
                    : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                }`}
              >
                <Flame className="w-4 h-4" /> Bola de neve
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-500 mb-4">
          {strategy === "avalanche"
            ? "Avalanche: ataca a dívida de maior juro primeiro — paga menos juros no total."
            : "Bola de neve: quita a menor dívida primeiro — vitórias rápidas para manter a motivação."}
        </p>

        {!payoff && (
          <div className="text-sm text-zinc-500 bg-zinc-950/50 border border-zinc-800 rounded-2xl p-4">
            {active.length === 0
              ? "Cadastre dívidas ativas (com juros e valor) para simular o plano."
              : "Informe um orçamento mensal para ver o plano."}
          </div>
        )}

        {payoff && (
          <div className="space-y-4">
            {!payoff.feasible && (
              <div className="flex items-start gap-2 text-sm bg-red-900/20 border border-red-900/40 text-red-300 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Com {brl(budgetNum)}/mês os juros crescem mais rápido que os pagamentos. Aumente o orçamento (mínimo somado: {brl(payoff.totalMinPayment)}).
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                <p className="text-xs text-zinc-500 mb-1">Livre em</p>
                <p className="text-xl font-bold text-emerald-400">
                  {payoff.feasible ? formatMonths(payoff.monthsToDebtFree) : "—"}
                </p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
                <p className="text-xs text-zinc-500 mb-1">Juros totais</p>
                <p className="text-xl font-bold text-red-400">{brl(payoff.totalInterest)}</p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 col-span-2 sm:col-span-1">
                <p className="text-xs text-zinc-500 mb-1">Total pago</p>
                <p className="text-xl font-bold text-zinc-200">{brl(payoff.totalPaid)}</p>
              </div>
            </div>

            {compare && compare.av.feasible && compare.sn.feasible && (
              <div className="text-xs text-zinc-400 bg-zinc-950/50 border border-zinc-800 rounded-xl p-3">
                {compare.av.totalInterest <= compare.sn.totalInterest ? (
                  <>
                    <span className="text-amber-300 font-semibold">Avalanche</span> economiza{" "}
                    <span className="text-emerald-400 font-semibold">
                      {brl(compare.sn.totalInterest - compare.av.totalInterest)}
                    </span>{" "}
                    em juros vs. bola de neve.
                  </>
                ) : (
                  <>Ambas as estratégias custam juros parecidos aqui. Escolha a que te motiva mais.</>
                )}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Ordem de quitação
              </p>
              <div className="space-y-2">
                {payoff.perDebt
                  .filter((d) => d.payoffMonth > 0 || payoff.feasible)
                  .map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5"
                    >
                      <span className="text-xs font-bold bg-zinc-800 text-zinc-300 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                        {d.order}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-zinc-200 truncate">{d.name}</p>
                        <p className="text-xs text-zinc-500">
                          {brl(d.initialBalance)} · juros {brl(d.interestPaid)}
                        </p>
                      </div>
                      <span className="text-xs text-emerald-400 font-semibold whitespace-nowrap flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {d.payoffMonth > 0 ? formatMonths(d.payoffMonth) : "—"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Debts + Goals lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debts */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              Dívidas
            </h3>
            <button
              onClick={openNewDebt}
              className="flex items-center gap-1.5 text-sm px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Nova
            </button>
          </div>
          <div className="space-y-3">
            {debtsList.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-6">Nenhuma dívida cadastrada.</p>
            )}
            {debtsList.map((debt, index) => {
              const badge = statusBadge[debt.status];
              return (
                <div
                  key={debt.id}
                  className={`rounded-2xl border p-4 ${
                    debt.status === "em_negociacao"
                      ? "bg-indigo-900/10 border-indigo-900/30"
                      : debt.status === "descontado_folha"
                      ? "bg-zinc-800/20 border-zinc-800/50"
                      : "bg-red-900/10 border-red-900/20"
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-xs font-bold bg-zinc-800 text-zinc-400 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-zinc-200 truncate">{debt.creditor}</h4>
                        {debt.description && (
                          <p className="text-xs text-zinc-400 line-clamp-1">{debt.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className={`px-2 py-0.5 text-[10px] rounded font-medium border ${badge.cls}`}>
                            {badge.label}
                          </span>
                          {debt.interestRate != null && (
                            <span className="px-2 py-0.5 text-[10px] rounded font-medium border bg-amber-500/10 text-amber-400 border-amber-500/20">
                              {debt.interestRate}%/mês
                            </span>
                          )}
                          {debt.minPayment != null && debt.minPayment > 0 && (
                            <span className="px-2 py-0.5 text-[10px] rounded font-medium border bg-zinc-500/10 text-zinc-400 border-zinc-500/20">
                              mín {brl(debt.minPayment)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span
                        className={`font-bold whitespace-nowrap ${
                          debt.status === "descontado_folha" ? "text-zinc-500" : "text-red-400"
                        }`}
                      >
                        {brl(debt.amount)}
                      </span>
                      <div className="flex gap-1">
                        {debt.status !== "paga" && (
                          <button
                            onClick={() => onUpdateDebt(debt.id, { status: "paga" })}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-600 text-zinc-400 hover:text-white transition-colors"
                            aria-label="Marcar como paga"
                            title="Marcar como paga"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditDebt(debt)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                          aria-label="Editar dívida"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmRemoveDebt(debt.id)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white transition-colors"
                          aria-label="Excluir dívida"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {debt.strategy && (
                    <p className="text-xs text-zinc-400 mt-3 pt-3 border-t border-zinc-800/50">
                      {debt.strategy}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Dívidas concluídas */}
          {paidDebts.length > 0 && (
            <div className="mt-6 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Concluídas ({paidDebts.length})
                </h4>
                <button
                  onClick={revertAllPaid}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reverter todas
                </button>
              </div>
              <div className="space-y-2">
                {paidDebts.map((debt) => (
                  <div
                    key={debt.id}
                    className="flex items-center gap-3 bg-emerald-900/5 border border-emerald-900/20 rounded-xl px-3 py-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-300 truncate line-through decoration-zinc-600">
                        {debt.creditor}
                      </p>
                      <p className="text-xs text-zinc-500">{brl(debt.amount)}</p>
                    </div>
                    <button
                      onClick={() => revertDebt(debt.id)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-amber-600 text-zinc-400 hover:text-white transition-colors shrink-0"
                      aria-label="Reverter dívida"
                      title="Reverter para ativa"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => confirmRemoveDebt(debt.id)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white transition-colors shrink-0"
                      aria-label="Excluir permanentemente"
                      title="Excluir permanentemente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Goals */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Metas
            </h3>
            <button
              onClick={openNewGoal}
              className="flex items-center gap-1.5 text-sm px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Nova
            </button>
          </div>
          <div className="space-y-4">
            {goals.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-6">Nenhuma meta cadastrada.</p>
            )}
            {goals.map((goal) => {
              const pct = goal.targetAmount > 0
                ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100)
                : 0;
              const done = goal.savedAmount >= goal.targetAmount && goal.targetAmount > 0;
              return (
                <div key={goal.id} className="rounded-2xl border bg-emerald-900/10 border-emerald-900/20 p-4">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="min-w-0">
                      <h4 className="font-bold text-zinc-200 truncate flex items-center gap-2">
                        {goal.title}
                        {done && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {format(parseISO(goal.deadline), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setContribGoalId(contribGoalId === goal.id ? null : goal.id);
                          setContribValue("");
                        }}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-600 text-zinc-400 hover:text-white transition-colors"
                        aria-label="Adicionar aporte"
                        title="Adicionar aporte"
                      >
                        <PiggyBank className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditGoal(goal)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                        aria-label="Editar meta"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmRemoveGoal(goal.id)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white transition-colors"
                        aria-label="Excluir meta"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-emerald-400 font-semibold">{brl(goal.savedAmount)}</span>
                    <span className="text-zinc-500">{brl(goal.targetAmount)}</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {Math.round(pct)}% · falta {brl(Math.max(0, goal.targetAmount - goal.savedAmount))}
                  </p>

                  {contribGoalId === goal.id && (
                    <div className="flex gap-2 mt-3">
                      <input
                        type="number"
                        step="0.01"
                        autoFocus
                        value={contribValue}
                        onChange={(e) => setContribValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitContribution(goal.id);
                        }}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        placeholder="Valor do aporte (use - para retirar)"
                      />
                      <button
                        onClick={() => submitContribution(goal.id)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-sm font-semibold transition-colors"
                      >
                        Aportar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Compras Futuras */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-sky-400" />
            Compras Futuras
          </h3>
          <button
            onClick={openNewPurchase}
            className="flex items-center gap-1.5 text-sm px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Nova compra
          </button>
        </div>
        <div className="space-y-4">
          {plannedPurchases.length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-6">
              Nenhuma compra futura cadastrada.
            </p>
          )}
          {plannedPurchases.map((purchase) => {
            const pct =
              purchase.estimatedAmount > 0
                ? Math.min(100, (purchase.savedAmount / purchase.estimatedAmount) * 100)
                : 0;
            const done =
              purchase.savedAmount >= purchase.estimatedAmount &&
              purchase.estimatedAmount > 0;
            const badge = priorityBadge[purchase.priority || "media"];
            return (
              <div
                key={purchase.id}
                className="rounded-2xl border bg-sky-900/10 border-sky-900/20 p-4"
              >
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="min-w-0">
                    <h4 className="font-bold text-zinc-200 truncate flex items-center gap-2">
                      {purchase.name}
                      {done && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-zinc-400">
                        <Clock className="w-3 h-3" />
                        {format(parseISO(purchase.targetDate), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] rounded font-medium border ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setContribPurchaseId(
                          contribPurchaseId === purchase.id ? null : purchase.id
                        );
                        setContribPurchaseValue("");
                      }}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-sky-600 text-zinc-400 hover:text-white transition-colors"
                      aria-label="Adicionar aporte"
                      title="Adicionar aporte"
                    >
                      <PiggyBank className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditPurchase(purchase)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                      aria-label="Editar compra"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => confirmRemovePurchase(purchase.id)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white transition-colors"
                      aria-label="Excluir compra"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between text-xs mb-1">
                  <span className="text-sky-400 font-semibold">{brl(purchase.savedAmount)}</span>
                  <span className="text-zinc-500">{brl(purchase.estimatedAmount)}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-sky-400 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {Math.round(pct)}% · falta{" "}
                  {brl(Math.max(0, purchase.estimatedAmount - purchase.savedAmount))}
                </p>
                {purchase.notes && (
                  <p className="text-xs text-zinc-400 mt-2 pt-2 border-t border-zinc-800/50">
                    {purchase.notes}
                  </p>
                )}

                {contribPurchaseId === purchase.id && (
                  <div className="flex gap-2 mt-3">
                    <input
                      type="number"
                      step="0.01"
                      autoFocus
                      value={contribPurchaseValue}
                      onChange={(e) => setContribPurchaseValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitPurchaseContribution(purchase.id);
                      }}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                      placeholder="Valor do aporte (use - para retirar)"
                    />
                    <button
                      onClick={() => submitPurchaseContribution(purchase.id)}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black rounded-xl text-sm font-semibold transition-colors"
                    >
                      Aportar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {debtModalOpen && (
        <DebtModal
          editingDebt={editingDebt}
          onSave={saveDebt}
          onDelete={onRemoveDebt}
          onClose={() => setDebtModalOpen(false)}
        />
      )}
      {goalModalOpen && (
        <GoalModal
          editingGoal={editingGoal}
          onSave={saveGoal}
          onDelete={onRemoveGoal}
          onClose={() => setGoalModalOpen(false)}
        />
      )}
      {purchaseModalOpen && (
        <PurchaseModal
          editingPurchase={editingPurchase}
          onSave={savePurchase}
          onDelete={onRemovePurchase}
          onClose={() => setPurchaseModalOpen(false)}
        />
      )}
    </div>
  );
}
