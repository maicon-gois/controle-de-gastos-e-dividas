export type TransactionType = "entrada" | "saida";

export interface Category {
  id: string;
  name: string;
  type: TransactionType | "ambos";
  color: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  categoryId: string;
  description: string;
  amount: number;
  date: string; // ISO string
  userId?: string;
  tags?: string[];
}

export interface Debt {
  id: string;
  userId?: string;
  creditor: string;
  description: string;
  amount: number;
  status: 'atrasada' | 'em_negociacao' | 'paga' | 'descontado_folha';
  dueDate?: string;
  strategy?: string;
}

export interface Goal {
  id: string;
  userId?: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  description?: string;
}

export type PriorityStrategy = "menor" | "maior" | "oportunidade";

export interface RecurringItem {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
}

export interface IncomeItem {
  id: string;
  description: string;
  amount: number;
}

export interface ProjectionAssumptions {
  incomes: IncomeItem[];
  recurring: RecurringItem[];
  startYear: number;
  startMonth: number; // 1-12
  horizonMonths: number;
  startingSaved: number;
  priorityStrategy: PriorityStrategy;
}

export interface MonthDecision {
  monthKey: string; // "YYYY-MM"
  allocations: { debtId: string; amount: number }[];
  saved: number;
}

export const CATEGORIES: Category[] = [
  { id: "salario", name: "Salário", type: "entrada", color: "bg-green-500" },
  { id: "renda-extra", name: "Renda Extra", type: "entrada", color: "bg-emerald-400" },
  { id: "moradia", name: "Moradia", type: "saida", color: "bg-blue-500" },
  { id: "alimentacao", name: "Alimentação", type: "saida", color: "bg-orange-500" },
  { id: "mercado", name: "Mercado", type: "saida", color: "bg-yellow-500" },
  { id: "transporte", name: "Transporte", type: "saida", color: "bg-slate-500" },
  { id: "saude", name: "Saúde", type: "saida", color: "bg-red-400" },
  { id: "lazer", name: "Lazer", type: "saida", color: "bg-pink-500" },
  { id: "educacao", name: "Educação", type: "saida", color: "bg-indigo-500" },
  { id: "telecom", name: "Internet/Celular", type: "saida", color: "bg-sky-500" },
  { id: "filhas", name: "Filhas (Pensão/Despesas)", type: "saida", color: "bg-purple-500" },
  { id: "ferramentas", name: "Ferramentas/Assinaturas", type: "saida", color: "bg-zinc-500" },
  { id: "outros", name: "Outros", type: "ambos", color: "bg-zinc-500" },
];

export const TAGS = [
  "detran",
  "banco",
  "saúde",
  "filhas",
  "tecnologia",
  "assinaturas",
  "impostos",
  "casa",
  "essencial"
];
