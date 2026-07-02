import { Transaction, Debt, Goal, PlannedPurchase } from "@/lib/types";
import { ProfileId } from "@/lib/profiles";
import {
  INITIAL_TRANSACTIONS,
  INITIAL_DEBTS,
  INITIAL_GOALS,
  genId,
} from "@/lib/seed-data";

export interface ProfileSeedData {
  transactions: Omit<Transaction, "userId" | "profileId">[];
  debts: Omit<Debt, "userId" | "profileId">[];
  goals: Omit<Goal, "userId" | "profileId">[];
  plannedPurchases: Omit<PlannedPurchase, "userId" | "profileId">[];
}

const MAICON_TRANSACTIONS: Omit<Transaction, "userId" | "profileId">[] = [
  { id: "m1", type: "entrada", categoryId: "salario", description: "Salário Maicon", amount: 2582.52, date: "2026-07-01T12:00:00Z" },
  { id: "m2", type: "entrada", categoryId: "renda-extra", description: "Renda Extra", amount: 190.0, date: "2026-07-05T12:00:00Z" },
  { id: "m3", type: "saida", categoryId: "filhas", description: "Pensão Bia", amount: 600.0, date: "2026-07-10T12:00:00Z", tags: ["filhas"] },
  { id: "m4", type: "saida", categoryId: "moradia", description: "Cibele (minha parte)", amount: 160.0, date: "2026-07-10T12:00:00Z", tags: ["casa"] },
  { id: "m5", type: "saida", categoryId: "moradia", description: "Luz (minha parte)", amount: 150.0, date: "2026-07-10T12:00:00Z", tags: ["casa", "essencial"] },
  { id: "m6", type: "saida", categoryId: "telecom", description: "Internet (minha parte)", amount: 58.0, date: "2026-07-10T12:00:00Z", tags: ["casa", "assinaturas"] },
  { id: "m7", type: "saida", categoryId: "telecom", description: "Vivo", amount: 100.0, date: "2026-07-10T12:00:00Z", tags: ["assinaturas"] },
  { id: "m8", type: "saida", categoryId: "educacao", description: "Faculdade", amount: 160.0, date: "2026-07-10T12:00:00Z", tags: ["essencial"] },
  { id: "m9", type: "saida", categoryId: "mercado", description: "Mercado (minha parte)", amount: 310.0, date: "2026-07-10T12:00:00Z", tags: ["essencial"] },
  { id: "m10", type: "saida", categoryId: "outros", description: "Emp. Consignado CLT", amount: 348.11, date: "2026-07-01T12:00:00Z", tags: ["banco"] },
  { id: "m11", type: "saida", categoryId: "outros", description: "Emp. Consignado CLT 3", amount: 387.81, date: "2026-07-01T12:00:00Z", tags: ["banco"] },
  { id: "m12", type: "saida", categoryId: "outros", description: "Desconto INSS", amount: 216.82, date: "2026-07-01T12:00:00Z", tags: ["impostos"] },
  { id: "m13", type: "saida", categoryId: "alimentacao", description: "Vale Alimentação", amount: 225.0, date: "2026-07-01T12:00:00Z", tags: ["essencial"] },
  { id: "m14", type: "saida", categoryId: "ferramentas", description: "Cursor", amount: 105.0, date: "2026-07-10T12:00:00Z", tags: ["tecnologia", "assinaturas"] },
  { id: "m15", type: "saida", categoryId: "filhas", description: "Guardar para Bia", amount: 253.0, date: "2026-07-10T12:00:00Z", tags: ["filhas"] },
];

const MAICON_DEBTS: Omit<Debt, "userId" | "profileId">[] = [
  { id: "md1", creditor: "Detran RS (Fiesta)", description: "IPVA 2026 pendente", amount: 777.43, status: "atrasada", interestRate: 1.0, minPayment: 100 },
  { id: "md2", creditor: "Nubank", description: "Dívida Cartão", amount: 200.0, status: "atrasada", interestRate: 12.0, minPayment: 50 },
  { id: "md3", creditor: "Empréstimo Consignado", description: "36x R$ 348,11 (Descontado em folha)", amount: 12531.96, status: "descontado_folha" },
  { id: "md4", creditor: "Empréstimo Consignado", description: "36x R$ 387,81 (Descontado em folha)", amount: 13961.16, status: "descontado_folha" },
];

const MAICON_GOALS: Omit<Goal, "userId" | "profileId">[] = [
  { id: "mg1", title: "Presente Bia", targetAmount: 300.0, savedAmount: 0, deadline: "2026-08-21T00:00:00Z", description: "Presente de aniversário." },
  { id: "mg2", title: "Reserva emergência", targetAmount: 2000.0, savedAmount: 0, deadline: "2026-12-31T00:00:00Z" },
];

const GABRIELLE_TRANSACTIONS: Omit<Transaction, "userId" | "profileId">[] = [
  { id: "g1", type: "entrada", categoryId: "salario", description: "Salário Gabrielle", amount: 1600.0, date: "2026-07-05T12:00:00Z" },
  { id: "g2", type: "entrada", categoryId: "renda-extra", description: "Bolsa Família", amount: 600.0, date: "2026-07-05T12:00:00Z" },
  { id: "g3", type: "saida", categoryId: "moradia", description: "Aluguel", amount: 900.0, date: "2026-07-05T12:00:00Z", tags: ["casa", "essencial"] },
  { id: "g4", type: "saida", categoryId: "moradia", description: "Luz", amount: 180.0, date: "2026-07-08T12:00:00Z", tags: ["casa", "essencial"] },
  { id: "g5", type: "saida", categoryId: "moradia", description: "Água", amount: 65.0, date: "2026-07-08T12:00:00Z", tags: ["casa", "essencial"] },
  { id: "g6", type: "saida", categoryId: "telecom", description: "Internet", amount: 89.90, date: "2026-07-08T12:00:00Z", tags: ["casa", "assinaturas"] },
  { id: "g7", type: "saida", categoryId: "telecom", description: "Celular", amount: 55.0, date: "2026-07-08T12:00:00Z", tags: ["assinaturas"] },
  { id: "g8", type: "saida", categoryId: "mercado", description: "Mercado (Liz e Murilo)", amount: 450.0, date: "2026-07-10T12:00:00Z", tags: ["essencial"] },
  { id: "g9", type: "saida", categoryId: "educacao", description: "Material escolar Liz", amount: 120.0, date: "2026-07-10T12:00:00Z", tags: ["essencial"] },
  { id: "g10", type: "saida", categoryId: "educacao", description: "Material escolar Murilo", amount: 80.0, date: "2026-07-10T12:00:00Z", tags: ["essencial"] },
  { id: "g11", type: "saida", categoryId: "saude", description: "Plano de saúde crianças", amount: 180.0, date: "2026-07-10T12:00:00Z", tags: ["saúde"] },
  { id: "g12", type: "saida", categoryId: "transporte", description: "Transporte escolar", amount: 200.0, date: "2026-07-10T12:00:00Z" },
  { id: "g13", type: "saida", categoryId: "lazer", description: "Lazer crianças", amount: 80.0, date: "2026-07-15T12:00:00Z" },
  { id: "g14", type: "saida", categoryId: "alimentacao", description: "Lanche escolar", amount: 150.0, date: "2026-07-10T12:00:00Z", tags: ["essencial"] },
];

const GABRIELLE_DEBTS: Omit<Debt, "userId" | "profileId">[] = [
  { id: "gd1", creditor: "Cartão Renner", description: "Fatura atrasada", amount: 450.0, status: "atrasada", interestRate: 14.0, minPayment: 80 },
  { id: "gd2", creditor: "Mercado Pago", description: "Parcelamento celular", amount: 320.0, status: "em_negociacao", interestRate: 3.0, minPayment: 60 },
];

const GABRIELLE_GOALS: Omit<Goal, "userId" | "profileId">[] = [
  { id: "gg1", title: "Presente Liz", targetAmount: 200.0, savedAmount: 50.0, deadline: "2026-09-15T00:00:00Z" },
  { id: "gg2", title: "Reserva aluguel (1 mês)", targetAmount: 900.0, savedAmount: 0, deadline: "2026-11-01T00:00:00Z" },
];

const DEMO_TRANSACTIONS: Omit<Transaction, "userId" | "profileId">[] = [
  { id: "d1", type: "entrada", categoryId: "salario", description: "Salário CLT", amount: 3000.0, date: "2026-07-05T12:00:00Z" },
  { id: "d2", type: "saida", categoryId: "moradia", description: "Aluguel", amount: 850.0, date: "2026-07-05T12:00:00Z", tags: ["casa", "essencial"] },
  { id: "d3", type: "saida", categoryId: "moradia", description: "Luz", amount: 145.0, date: "2026-07-08T12:00:00Z", tags: ["casa", "essencial"] },
  { id: "d4", type: "saida", categoryId: "moradia", description: "Água", amount: 55.0, date: "2026-07-08T12:00:00Z", tags: ["casa", "essencial"] },
  { id: "d5", type: "saida", categoryId: "telecom", description: "Internet", amount: 99.90, date: "2026-07-08T12:00:00Z", tags: ["casa", "assinaturas"] },
  { id: "d6", type: "saida", categoryId: "telecom", description: "Celular", amount: 59.90, date: "2026-07-08T12:00:00Z", tags: ["assinaturas"] },
  { id: "d7", type: "saida", categoryId: "mercado", description: "Mercado mensal", amount: 520.0, date: "2026-07-10T12:00:00Z", tags: ["essencial"] },
  { id: "d8", type: "saida", categoryId: "transporte", description: "Combustível", amount: 280.0, date: "2026-07-12T12:00:00Z" },
  { id: "d9", type: "saida", categoryId: "outros", description: "Cartão de crédito", amount: 350.0, date: "2026-07-15T12:00:00Z", tags: ["banco"] },
  { id: "d10", type: "saida", categoryId: "ferramentas", description: "Netflix + Spotify", amount: 55.90, date: "2026-07-05T12:00:00Z", tags: ["assinaturas"] },
  { id: "d11", type: "saida", categoryId: "saude", description: "Farmácia", amount: 89.0, date: "2026-07-18T12:00:00Z", tags: ["saúde"] },
  { id: "d12", type: "saida", categoryId: "lazer", description: "Cinema / lazer", amount: 120.0, date: "2026-07-20T12:00:00Z" },
];

const DEMO_DEBTS: Omit<Debt, "userId" | "profileId">[] = [
  { id: "dd1", creditor: "Nubank", description: "Cartão de crédito", amount: 1200.0, status: "atrasada", interestRate: 12.5, minPayment: 150 },
  { id: "dd2", creditor: "Magazine Luiza", description: "Parcelamento eletro", amount: 680.0, status: "em_negociacao", interestRate: 2.5, minPayment: 85 },
];

const DEMO_GOALS: Omit<Goal, "userId" | "profileId">[] = [
  { id: "dg1", title: "Reserva de emergência", targetAmount: 3000.0, savedAmount: 450.0, deadline: "2026-12-31T00:00:00Z", description: "3 meses de despesas." },
];

const DEMO_PURCHASES: Omit<PlannedPurchase, "userId" | "profileId">[] = [
  { id: genId(), name: "Geladeira nova", estimatedAmount: 2500.0, savedAmount: 300.0, targetDate: "2026-11-01T00:00:00Z", priority: "alta", notes: "Substituir a atual que está com defeito." },
  { id: genId(), name: "Notebook", estimatedAmount: 3500.0, savedAmount: 0, targetDate: "2027-03-01T00:00:00Z", priority: "media" },
];

export function getProfileSeed(profileId: ProfileId): ProfileSeedData {
  switch (profileId) {
    case "casal":
      return {
        transactions: INITIAL_TRANSACTIONS,
        debts: INITIAL_DEBTS,
        goals: INITIAL_GOALS,
        plannedPurchases: [],
      };
    case "maicon":
      return {
        transactions: MAICON_TRANSACTIONS,
        debts: MAICON_DEBTS,
        goals: MAICON_GOALS,
        plannedPurchases: [],
      };
    case "gabrielle":
      return {
        transactions: GABRIELLE_TRANSACTIONS,
        debts: GABRIELLE_DEBTS,
        goals: GABRIELLE_GOALS,
        plannedPurchases: [],
      };
    case "demo":
      return {
        transactions: DEMO_TRANSACTIONS,
        debts: DEMO_DEBTS,
        goals: DEMO_GOALS,
        plannedPurchases: DEMO_PURCHASES,
      };
  }
}
