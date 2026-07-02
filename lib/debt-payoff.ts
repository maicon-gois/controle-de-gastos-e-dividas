import { Debt } from "@/lib/types";

export type PayoffStrategy = "avalanche" | "snowball";

export interface PayoffDebtResult {
  id: string;
  name: string;
  order: number; // ordem de ataque (1 = primeira a quitar)
  initialBalance: number;
  interestPaid: number;
  payoffMonth: number; // mês em que zera (1-based)
}

export interface PayoffResult {
  strategy: PayoffStrategy;
  feasible: boolean; // orçamento cobre o mínimo + juros
  monthsToDebtFree: number;
  totalInterest: number;
  totalPaid: number;
  monthlyBudget: number;
  totalMinPayment: number;
  perDebt: PayoffDebtResult[];
}

/** Considera apenas dívidas ativas (não pagas, não descontadas em folha). */
export function activePayableDebts(debts: Debt[]): Debt[] {
  return debts.filter(
    (d) => d.status === "atrasada" || d.status === "em_negociacao"
  );
}

const MAX_MONTHS = 600; // 50 anos: trava de segurança

/**
 * Simula a quitação das dívidas mês a mês.
 * Estratégia define qual dívida recebe o valor extra do orçamento:
 * - avalanche: maior juros primeiro (menor custo total)
 * - snowball: menor saldo primeiro (motivação/vitórias rápidas)
 */
export function simulatePayoff(
  debts: Debt[],
  monthlyBudget: number,
  strategy: PayoffStrategy
): PayoffResult {
  const active = activePayableDebts(debts);

  const state = active.map((d) => ({
    id: d.id,
    name: d.creditor,
    balance: d.amount,
    initialBalance: d.amount,
    monthlyRate: (d.interestRate ?? 0) / 100,
    minPayment: d.minPayment ?? 0,
    interestPaid: 0,
    payoffMonth: 0,
  }));

  const totalMinPayment = state.reduce((acc, s) => acc + s.minPayment, 0);

  const orderFn = (a: typeof state[number], b: typeof state[number]) => {
    if (strategy === "avalanche") {
      if (b.monthlyRate !== a.monthlyRate) return b.monthlyRate - a.monthlyRate;
      return a.balance - b.balance;
    }
    // snowball
    if (a.balance !== b.balance) return a.balance - b.balance;
    return b.monthlyRate - a.monthlyRate;
  };

  let month = 0;
  let totalInterest = 0;
  let totalPaid = 0;
  let feasible = true;

  while (state.some((s) => s.balance > 0.005) && month < MAX_MONTHS) {
    month++;

    // 1. Juros do mês
    for (const s of state) {
      if (s.balance > 0.005) {
        const interest = s.balance * s.monthlyRate;
        s.balance += interest;
        s.interestPaid += interest;
        totalInterest += interest;
      }
    }

    let budget = monthlyBudget;

    // 2. Pagamentos mínimos
    for (const s of state) {
      if (s.balance <= 0.005) continue;
      const pay = Math.min(s.minPayment, s.balance, budget);
      s.balance -= pay;
      budget -= pay;
      totalPaid += pay;
    }

    // 3. Sobra do orçamento vai para a dívida-alvo (ordem da estratégia)
    const targets = state
      .filter((s) => s.balance > 0.005)
      .sort(orderFn);

    for (const s of targets) {
      if (budget <= 0.005) break;
      const pay = Math.min(budget, s.balance);
      s.balance -= pay;
      budget -= pay;
      totalPaid += pay;
    }

    // 4. Marca as que zeraram neste mês
    for (const s of state) {
      if (s.balance <= 0.005 && s.payoffMonth === 0) {
        s.payoffMonth = month;
        s.balance = 0;
      }
    }
  }

  // Se ainda há saldo, o orçamento não vence os juros
  if (state.some((s) => s.balance > 0.005)) {
    feasible = false;
  }

  // ordem de quitação
  const paidOrder = [...state]
    .filter((s) => s.payoffMonth > 0)
    .sort((a, b) => a.payoffMonth - b.payoffMonth || orderFn(a, b));

  const orderMap = new Map<string, number>();
  paidOrder.forEach((s, i) => orderMap.set(s.id, i + 1));

  const perDebt: PayoffDebtResult[] = state.map((s) => ({
    id: s.id,
    name: s.name,
    order: orderMap.get(s.id) ?? 999,
    initialBalance: s.initialBalance,
    interestPaid: s.interestPaid,
    payoffMonth: s.payoffMonth,
  }));
  perDebt.sort((a, b) => a.order - b.order);

  return {
    strategy,
    feasible,
    monthsToDebtFree: feasible ? month : 0,
    totalInterest,
    totalPaid,
    monthlyBudget,
    totalMinPayment,
    perDebt,
  };
}

/** Formata número de meses como "1a 2m". */
export function formatMonths(months: number): string {
  if (months <= 0) return "—";
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} ${m === 1 ? "mês" : "meses"}`;
  if (m === 0) return `${y} ${y === 1 ? "ano" : "anos"}`;
  return `${y}a ${m}m`;
}
