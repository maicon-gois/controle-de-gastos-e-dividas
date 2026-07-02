import {
  Debt,
  MonthDecision,
  ProjectionAssumptions,
} from "./types";

const MONTH_NAMES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
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

export interface DebtSnapshot {
  id: string;
  creditor: string;
  description: string;
  remaining: number;
  status: Debt["status"];
}

export interface ProjectedMonth {
  key: string;
  year: number;
  month: number;
  label: string;
  income: number;
  expenses: number;
  baseSurplus: number;
  carryIn: number;
  available: number;
  paid: number;
  saved: number;
  free: number;
  allocations: { debtId: string; creditor: string; amount: number }[];
  priorityDebtId: string | null;
  priorityCreditor: string | null;
  priorityRemainingBefore: number;
  monthsToClearPriority: number | null;
  decided: boolean;
  debtsSnapshot: DebtSnapshot[];
  remainingDebtTotal: number;
}

export interface ProjectionResult {
  months: ProjectedMonth[];
  income: number;
  expenses: number;
  baseSurplus: number;
  totalActiveDebt: number;
  debtFreeMonthLabel: string | null;
  totalPaidPlanned: number;
}

/** Active debts we plan to attack (folha excluded — já sai do salário). */
export function activeDebts(debts: Debt[]) {
  return debts.filter(
    (d) => d.status === "atrasada" || d.status === "em_negociacao"
  );
}

function orderDebts(
  debts: Debt[],
  strategy: ProjectionAssumptions["priorityStrategy"]
): Debt[] {
  const arr = activeDebts(debts).slice();
  switch (strategy) {
    case "menor":
      arr.sort((a, b) => a.amount - b.amount);
      break;
    case "maior":
      arr.sort((a, b) => b.amount - a.amount);
      break;
    case "oportunidade":
      arr.sort((a, b) => {
        const na = a.status === "em_negociacao" ? 0 : 1;
        const nb = b.status === "em_negociacao" ? 0 : 1;
        if (na !== nb) return na - nb;
        return a.amount - b.amount;
      });
      break;
  }
  return arr;
}

export function computeProjection(
  debts: Debt[],
  assumptions: ProjectionAssumptions,
  decisions: Record<string, MonthDecision>
): ProjectionResult {
  const ordered = orderDebts(debts, assumptions.priorityStrategy);
  const remaining: Record<string, number> = {};
  ordered.forEach((d) => (remaining[d.id] = d.amount));

  const income = round2(
    assumptions.incomes.reduce((a, b) => a + (Number(b.amount) || 0), 0)
  );
  const expenses = round2(
    assumptions.recurring.reduce((a, b) => a + (Number(b.amount) || 0), 0)
  );
  const baseSurplus = round2(income - expenses);
  const totalActiveDebt = round2(ordered.reduce((a, d) => a + d.amount, 0));

  const months: ProjectedMonth[] = [];
  let carryIn = round2(assumptions.startingSaved || 0);
  let y = assumptions.startYear;
  let m = assumptions.startMonth;
  let debtFreeMonthLabel: string | null = null;
  let totalPaidPlanned = 0;

  for (let i = 0; i < assumptions.horizonMonths; i++) {
    const key = monthKeyOf(y, m);
    const label = monthLabelOf(y, m);
    const available = round2(baseSurplus + carryIn);

    // snapshot before applying this month's decision
    const debtsSnapshot: DebtSnapshot[] = ordered
      .filter((d) => remaining[d.id] > 0.009)
      .map((d) => ({
        id: d.id,
        creditor: d.creditor,
        description: d.description,
        remaining: round2(remaining[d.id]),
        status: d.status,
      }));

    const priority = ordered.find((d) => remaining[d.id] > 0.009) || null;
    const priorityRemainingBefore = priority ? round2(remaining[priority.id]) : 0;

    let paid = 0;
    let saved = 0;
    const allocations: { debtId: string; creditor: string; amount: number }[] = [];

    const decision = decisions[key];
    if (decision) {
      decision.allocations.forEach((al) => {
        const rem = remaining[al.debtId] ?? 0;
        const pay = Math.min(Number(al.amount) || 0, rem);
        if (pay > 0) {
          remaining[al.debtId] = round2(rem - pay);
          paid = round2(paid + pay);
          const d = ordered.find((x) => x.id === al.debtId);
          allocations.push({
            debtId: al.debtId,
            creditor: d?.creditor || "",
            amount: round2(pay),
          });
        }
      });
      saved = Math.max(0, round2(Number(decision.saved) || 0));
    }

    totalPaidPlanned = round2(totalPaidPlanned + paid);
    const free = round2(available - paid - saved);
    const remainingDebtTotal = round2(
      ordered.reduce((a, d) => a + remaining[d.id], 0)
    );

    if (remainingDebtTotal <= 0.009 && !debtFreeMonthLabel && totalActiveDebt > 0) {
      debtFreeMonthLabel = label;
    }

    months.push({
      key,
      year: y,
      month: m,
      label,
      income,
      expenses,
      baseSurplus,
      carryIn,
      available,
      paid,
      saved,
      free,
      allocations,
      priorityDebtId: priority?.id || null,
      priorityCreditor: priority?.creditor || null,
      priorityRemainingBefore,
      monthsToClearPriority:
        priority && available > 0
          ? Math.ceil(priorityRemainingBefore / available)
          : null,
      decided: !!decision,
      debtsSnapshot,
      remainingDebtTotal,
    });

    // only the explicitly saved amount rolls into next month
    carryIn = saved;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  return {
    months,
    income,
    expenses,
    baseSurplus,
    totalActiveDebt,
    debtFreeMonthLabel,
    totalPaidPlanned,
  };
}
