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
  profileId?: string;
  tags?: string[];
}

export type DebtStatus = 'atrasada' | 'em_negociacao' | 'paga' | 'descontado_folha';

export interface Debt {
  id: string;
  userId?: string;
  profileId?: string;
  creditor: string;
  description: string;
  amount: number;
  status: DebtStatus;
  dueDate?: string;
  strategy?: string;
  interestRate?: number; // juros ao mês em % (ex: 2.5)
  minPayment?: number; // pagamento mínimo mensal
}

export interface Goal {
  id: string;
  userId?: string;
  profileId?: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  description?: string;
}

export type PurchasePriority = "alta" | "media" | "baixa";

export interface PlannedPurchase {
  id: string;
  userId?: string;
  profileId?: string;
  name: string;
  estimatedAmount: number;
  savedAmount: number;
  targetDate: string;
  priority?: PurchasePriority;
  notes?: string;
}

/** Plano de quitação recorrente: entra como uma linha em todos os meses. */
export interface PaymentPlan {
  id: string;
  label: string; // ex: "Plano de quitação Fiesta"
  debtId?: string; // dívida vinculada (opcional)
  monthlyAmount: number; // valor pago por mês
  totalAmount: number; // total a quitar
  startMonthKey: string; // "YYYY-MM" a partir de quando começa
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
