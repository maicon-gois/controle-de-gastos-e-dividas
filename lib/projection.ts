import { Transaction, Debt, PaymentPlan } from "./types";

const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function monthKeyOf(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function monthLabelOf(year: number, month: number) {
  return `${MONTH_NAMES[month - 1]}/${year}`;
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface MonthPlanLine {
  planId: string;
  label: string;
  amount: number;
  quitaAqui: boolean;
}

export interface ProjectedMonth {
  key: string;
  year: number;
  month: number;
  label: string;
  hasRealData: boolean;
  realIncome: number;
  realExpense: number;
  realLeftover: number; // sobra real do mês (entradas - saídas)
  carryIn: number; // guardado dos meses anteriores
  available: number; // realLeftover + carryIn
  planLines: MonthPlanLine[];
  totalPlans: number; // soma das linhas de plano no mês
  free: number; // available - totalPlans (o que sobra livre / é guardado)
  shortfall: boolean; // available não cobre os planos
}

export interface PlanProgress {
  planId: string;
  label: string;
  monthlyAmount: number;
  total: number;
  paid: number;
  remaining: number;
  done: boolean;
  clearMonthLabel: string | null;
}

export interface ProjectionResult {
  months: ProjectedMonth[];
  plans: PlanProgress[];
  selectedLeftover: number;
  totalPlansMonthly: number;
}

/**
 * Projeção ancorada no mês selecionado.
 * - Cada mês usa a sobra REAL (entradas - saídas dos lançamentos reais).
 * - Cada plano de quitação entra como uma linha em todos os meses (do início até quitar).
 * - O que sobra livre é guardado e soma no mês seguinte (carry-over).
 */
export function computeProjection(
  transactions: Transaction[],
  debts: Debt[],
  plans: PaymentPlan[],
  startYear: number,
  startMonth: number,
  horizonMonths: number,
  startingSaved = 0
): ProjectionResult {
  // Agrupa lançamentos reais por mês
  const byMonth: Record<string, { income: number; expense: number; count: number }> = {};
  transactions.forEach((t) => {
    const d = new Date(t.date);
    const key = monthKeyOf(d.getFullYear(), d.getMonth() + 1);
    if (!byMonth[key]) byMonth[key] = { income: 0, expense: 0, count: 0 };
    byMonth[key].count++;
    if (t.type === "entrada") byMonth[key].income += t.amount;
    else byMonth[key].expense += t.amount;
  });

  const cumulative: Record<string, number> = {};
  const clearMonth: Record<string, string | null> = {};
  plans.forEach((p) => {
    cumulative[p.id] = 0;
    clearMonth[p.id] = null;
  });

  const months: ProjectedMonth[] = [];
  let carryIn = round2(startingSaved);
  let y = startYear;
  let m = startMonth;

  for (let i = 0; i < horizonMonths; i++) {
    const key = monthKeyOf(y, m);
    const label = monthLabelOf(y, m);
    const real = byMonth[key] || { income: 0, expense: 0, count: 0 };
    const realIncome = round2(real.income);
    const realExpense = round2(real.expense);
    const realLeftover = round2(realIncome - realExpense);
    const available = round2(realLeftover + carryIn);

    const planLines: MonthPlanLine[] = [];
    let totalPlans = 0;

    for (const p of plans) {
      if (key < p.startMonthKey) continue;
      const remaining = round2(p.totalAmount - cumulative[p.id]);
      if (remaining <= 0.009) continue; // já quitado
      const amount = round2(Math.min(p.monthlyAmount, remaining));
      cumulative[p.id] = round2(cumulative[p.id] + amount);
      const quitaAqui = cumulative[p.id] >= p.totalAmount - 0.009;
      if (quitaAqui && !clearMonth[p.id]) clearMonth[p.id] = label;
      planLines.push({ planId: p.id, label: p.label, amount, quitaAqui });
      totalPlans = round2(totalPlans + amount);
    }

    const free = round2(available - totalPlans);
    const shortfall = free < -0.009;
    const carryOut = free > 0 ? free : 0;

    months.push({
      key,
      year: y,
      month: m,
      label,
      hasRealData: real.count > 0,
      realIncome,
      realExpense,
      realLeftover,
      carryIn,
      available,
      planLines,
      totalPlans,
      free,
      shortfall,
    });

    carryIn = carryOut;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  const plansProgress: PlanProgress[] = plans.map((p) => {
    const paid = round2(Math.min(cumulative[p.id], p.totalAmount));
    return {
      planId: p.id,
      label: p.label,
      monthlyAmount: p.monthlyAmount,
      total: p.totalAmount,
      paid,
      remaining: round2(p.totalAmount - paid),
      done: paid >= p.totalAmount - 0.009,
      clearMonthLabel: clearMonth[p.id],
    };
  });

  const selected = months[0];

  return {
    months,
    plans: plansProgress,
    selectedLeftover: selected ? selected.realLeftover : 0,
    totalPlansMonthly: round2(plans.reduce((a, p) => a + p.monthlyAmount, 0)),
  };
}
