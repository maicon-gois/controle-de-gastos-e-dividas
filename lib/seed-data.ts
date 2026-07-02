import { Transaction, Debt, Goal } from "@/lib/types";

export const INITIAL_TRANSACTIONS: Omit<Transaction, "userId">[] = [
  { id: "1", type: "entrada", categoryId: "salario", description: "SALARIO (Mês 6)", amount: 2069.0, date: "2026-06-07T12:00:00Z" },
  { id: "2", type: "entrada", categoryId: "renda-extra", description: "SALARIO GABRIELLE (Mês 6)", amount: 1600.0, date: "2026-06-07T12:00:00Z" },
  { id: "3", type: "entrada", categoryId: "renda-extra", description: "Renda Extra", amount: 190.0, date: "2026-06-07T12:00:00Z" },
  { id: "4", type: "saida", categoryId: "filhas", description: "PENSAO BIA", amount: 600.0, date: "2026-06-07T12:00:00Z", tags: ["filhas"] },
  { id: "5", type: "saida", categoryId: "mercado", description: "hiper", amount: 619.0, date: "2026-06-07T12:00:00Z", tags: ["essencial"] },
  { id: "6", type: "saida", categoryId: "educacao", description: "FACULDADE", amount: 160.0, date: "2026-06-07T12:00:00Z", tags: ["essencial"] },
  { id: "7", type: "saida", categoryId: "moradia", description: "LUZ", amount: 300.0, date: "2026-06-07T12:00:00Z", tags: ["casa", "essencial"] },
  { id: "8", type: "saida", categoryId: "mercado", description: "erva", amount: 50.0, date: "2026-06-07T12:00:00Z" },
  { id: "9", type: "saida", categoryId: "telecom", description: "OSIR", amount: 116.0, date: "2026-06-07T12:00:00Z", tags: ["casa", "assinaturas"] },
  { id: "10", type: "saida", categoryId: "transporte", description: "carro oficina", amount: 650.0, date: "2026-06-07T12:00:00Z" },
  { id: "11", type: "saida", categoryId: "moradia", description: "CIBELE", amount: 320.0, date: "2026-06-07T12:00:00Z", tags: ["casa"] },
  { id: "12", type: "saida", categoryId: "telecom", description: "vivo", amount: 100.0, date: "2026-06-07T12:00:00Z", tags: ["assinaturas"] },
  { id: "13", type: "saida", categoryId: "saude", description: "consulta kelly", amount: 136.0, date: "2026-06-07T12:00:00Z", tags: ["saúde"] },
  { id: "14", type: "saida", categoryId: "saude", description: "consulta psiq", amount: 450.0, date: "2026-06-07T12:00:00Z", tags: ["saúde"] },
  { id: "15", type: "saida", categoryId: "ferramentas", description: "cursor", amount: 105.0, date: "2026-06-07T12:00:00Z", tags: ["tecnologia", "assinaturas"] },
  { id: "16", type: "saida", categoryId: "filhas", description: "guardar p bia", amount: 253.0, date: "2026-06-07T12:00:00Z", tags: ["filhas"] },
  { id: "17", type: "entrada", categoryId: "salario", description: "Horas Normais (06/2026)", amount: 1387.14, date: "2026-07-01T12:00:00Z" },
  { id: "18", type: "entrada", categoryId: "salario", description: "Horas Normais Noturnas", amount: 358.02, date: "2026-07-01T12:00:00Z" },
  { id: "19", type: "entrada", categoryId: "salario", description: "Horas Extras c/ 100%", amount: 169.09, date: "2026-07-01T12:00:00Z" },
  { id: "20", type: "entrada", categoryId: "salario", description: "DSR Reflexo H.Extras", amount: 42.27, date: "2026-07-01T12:00:00Z" },
  { id: "21", type: "entrada", categoryId: "salario", description: "Adicional Noturno", amount: 84.56, date: "2026-07-01T12:00:00Z" },
  { id: "22", type: "entrada", categoryId: "salario", description: "Periculosidade", amount: 541.67, date: "2026-07-01T12:00:00Z" },
  { id: "23", type: "entrada", categoryId: "salario", description: "DSR Adic. Noturno", amount: 36.24, date: "2026-07-01T12:00:00Z" },
  { id: "24", type: "entrada", categoryId: "salario", description: "Horas Noturnas Reduzidas", amount: 60.4, date: "2026-07-01T12:00:00Z" },
  { id: "25", type: "entrada", categoryId: "salario", description: "Premiação Sup Metas ADM", amount: 567.18, date: "2026-07-01T12:00:00Z" },
  { id: "30", type: "entrada", categoryId: "renda-extra", description: "SALÁRIO GABRIELLE (Mês 7)", amount: 1600.0, date: "2026-07-05T12:00:00Z" },
  { id: "26", type: "saida", categoryId: "outros", description: "Desconto INSS", amount: 216.82, date: "2026-07-01T12:00:00Z", tags: ["impostos"] },
  { id: "27", type: "saida", categoryId: "alimentacao", description: "Vale Alimentação", amount: 225.0, date: "2026-07-01T12:00:00Z", tags: ["essencial"] },
  { id: "28", type: "saida", categoryId: "outros", description: "Emp. Consignado CLT", amount: 348.11, date: "2026-07-01T12:00:00Z", tags: ["banco"] },
  { id: "29", type: "saida", categoryId: "outros", description: "Emp. Consignado CLT 3", amount: 387.81, date: "2026-07-01T12:00:00Z", tags: ["banco"] },
  { id: "31", type: "saida", categoryId: "filhas", description: "Pensão Bia", amount: 600.0, date: "2026-07-10T12:00:00Z", tags: ["filhas"] },
  { id: "32", type: "saida", categoryId: "moradia", description: "Cibele (Moradia)", amount: 320.0, date: "2026-07-10T12:00:00Z", tags: ["casa"] },
  { id: "33", type: "saida", categoryId: "moradia", description: "Luz", amount: 300.0, date: "2026-07-10T12:00:00Z", tags: ["casa", "essencial"] },
  { id: "34", type: "saida", categoryId: "telecom", description: "Internet (OSIR)", amount: 116.0, date: "2026-07-10T12:00:00Z", tags: ["casa", "assinaturas"] },
  { id: "35", type: "saida", categoryId: "telecom", description: "Vivo", amount: 100.0, date: "2026-07-10T12:00:00Z", tags: ["assinaturas"] },
  { id: "36", type: "saida", categoryId: "educacao", description: "Faculdade", amount: 160.0, date: "2026-07-10T12:00:00Z", tags: ["essencial"] },
  { id: "37", type: "saida", categoryId: "mercado", description: "Hiper (Mercado)", amount: 619.0, date: "2026-07-10T12:00:00Z", tags: ["essencial"] },
  { id: "38", type: "saida", categoryId: "mercado", description: "Erva", amount: 50.0, date: "2026-07-10T12:00:00Z" },
  { id: "39", type: "saida", categoryId: "ferramentas", description: "Cursor", amount: 105.0, date: "2026-07-10T12:00:00Z", tags: ["tecnologia", "assinaturas"] },
  { id: "40", type: "saida", categoryId: "saude", description: "Consulta Kelly", amount: 136.0, date: "2026-07-10T12:00:00Z", tags: ["saúde"] },
  { id: "41", type: "saida", categoryId: "saude", description: "Consulta Psiq", amount: 450.0, date: "2026-07-10T12:00:00Z", tags: ["saúde"] },
  { id: "42", type: "saida", categoryId: "transporte", description: "Carro Oficina", amount: 650.0, date: "2026-07-10T12:00:00Z" },
  { id: "43", type: "saida", categoryId: "filhas", description: "Guardar para Bia", amount: 253.0, date: "2026-07-10T12:00:00Z", tags: ["filhas"] },
];

export const INITIAL_DEBTS: Omit<Debt, "userId">[] = [
  { id: "d1", creditor: "Detran RS (Fiesta) Placa ITF5718", description: "Infração Bafômetro (Art. 165-A) - Vencida 12/01/2022", amount: 4003.51, status: "atrasada", strategy: "Prioridade: Verificar possibilidade de desconto de 40% no SNE (Carteira Digital de Trânsito)." },
  { id: "d2", creditor: "Detran RS (Fiesta) Placa ITF5H18", description: "IPVA 2026 (Pendente) - Venc. 30/04/2026", amount: 777.43, status: "atrasada", strategy: "Pagar para evitar bloqueio de licenciamento." },
  { id: "d3", creditor: "Detran RS (Fiesta) Placa ITF5H18", description: "IPVA 2025 - Venc. 30/04/2025 (Em Dívida Ativa)", amount: 781.55, status: "atrasada", strategy: "Dívida Ativa. Fazer parcelamento na Sefaz/RS." },
  { id: "d4", creditor: "Detran RS (Fiesta) Placa ITF5H18", description: "Taxa Licenciamento 2026 - Venc. 31/07/2026", amount: 114.09, status: "atrasada", strategy: "Pagar junto com o IPVA 2026." },
  { id: "d5", creditor: "Detran RS (Peugeot) Placa IOU5857", description: "IPVA 2026 (Pendente) - Venc. 30/04/2026", amount: 343.92, status: "atrasada", strategy: "Regularizar IPVA do ano vigente." },
  { id: "d6", creditor: "Detran RS (Peugeot) Placa IOU5857", description: "IPVA 2025 - Venc. 30/04/2025 (Em Dívida Ativa)", amount: 364.07, status: "atrasada", strategy: "Dívida Ativa. Fazer parcelamento na Sefaz/RS." },
  { id: "d7", creditor: "Detran RS (Peugeot) Placa IOU5857", description: "IPVA 2024 - Venc. 28/06/2024 (Em Dívida Ativa)", amount: 387.35, status: "atrasada", strategy: "Dívida Ativa. Fazer parcelamento na Sefaz/RS." },
  { id: "d8", creditor: "Detran RS (Peugeot) Placa IOU5857", description: "IPVA 2023 - Venc. 27/04/2023 (Em Dívida Ativa)", amount: 426.66, status: "atrasada", strategy: "Dívida Ativa. Fazer parcelamento na Sefaz/RS." },
  { id: "d9", creditor: "Detran RS (Peugeot) Placa IOU5857", description: "IPVA 2022 - Venc. 28/04/2022 (Em Dívida Ativa)", amount: 452.18, status: "atrasada", strategy: "Dívida Ativa. Fazer parcelamento na Sefaz/RS." },
  { id: "d10", creditor: "Detran RS (Peugeot) Placa IOU5857", description: "Taxa Licenciamento 2026 - Venc. 30/06/2026", amount: 114.09, status: "atrasada", strategy: "Pagar junto com o IPVA 2026." },
  { id: "d11", creditor: "Detran RS (Peugeot) Placa IOU5857", description: "Infrações Vencidas (10)", amount: 7901.03, status: "atrasada", strategy: "Tentar renegociação, parcelamento pelo Detran ou pagamento com desconto no app CDT." },
  { id: "d12", creditor: "Detran RS (Peugeot) Placa IOU5857", description: "Infração Aguardando Prazo Defesa (1)", amount: 293.47, status: "em_negociacao", strategy: "Acompanhar processo. Se indeferido, pagar com desconto de 20% ou 40%." },
  { id: "d13", creditor: "Anhanguera Educacional", description: "Conta Atrasada", amount: 156.28, status: "atrasada", strategy: "Quitar no próximo mês para evitar bloqueio acadêmico." },
  { id: "d14", creditor: "Mercado Pago", description: "Dívida Atrasada (CUPOM 78%) - De R$ 5.162,90", amount: 1135.84, status: "em_negociacao", strategy: "OPORTUNIDADE MASSIVA. Alta prioridade para quitar." },
  { id: "d15", creditor: "Nubank", description: "Dívida Cartão", amount: 200.0, status: "atrasada", strategy: "Valor baixo, quitar assim que sobrar um pequeno valor no mês para limpar o nome." },
  { id: "d16", creditor: "Itaú", description: "Dívida Cartão/Conta", amount: 500.0, status: "atrasada", strategy: "Ligar para negociar desconto à vista." },
  { id: "d17", creditor: "Empréstimo (Diversos)", description: "33x R$ 50,00", amount: 1650.0, status: "atrasada", strategy: "Tentar colocar em dia e manter pagamento mensal." },
  { id: "d18", creditor: "Empréstimo Consignado", description: "36x R$ 348,11 (Descontado em folha)", amount: 12531.96, status: "descontado_folha", strategy: "Dívida sob controle, descontada direto na folha." },
  { id: "d19", creditor: "Empréstimo Consignado", description: "36x R$ 387,81 (Descontado em folha)", amount: 13961.16, status: "descontado_folha", strategy: "Dívida sob controle, descontada direto na folha." },
];

export const INITIAL_GOALS: Omit<Goal, "userId">[] = [
  { id: "g1", title: "Presente filha mais velha", targetAmount: 500.0, savedAmount: 0, deadline: "2026-08-21T00:00:00Z", description: "Aniversário ou presente especial em agosto." },
  { id: "g2", title: "Operação filha mais velha (Parte 1)", targetAmount: 500.0, savedAmount: 0, deadline: "2026-10-31T00:00:00Z", description: "Primeira parte da ajuda para a operação." },
  { id: "g3", title: "Operação filha mais velha (Parte 2)", targetAmount: 500.0, savedAmount: 0, deadline: "2026-12-15T00:00:00Z", description: "Segunda parte da ajuda para a operação." },
  { id: "g4", title: "Checkup Carro (Viagem Porto Alegre)", targetAmount: 1000.0, savedAmount: 0, deadline: "2026-12-31T00:00:00Z", description: "Revisão geral para viajar seguro (após quitar as dívidas principais)." },
  { id: "g5", title: "Pensão Bia Direto na Folha", targetAmount: 600, savedAmount: 0, deadline: "2027-01-01T00:00:00Z", description: "Meta: colocar 30% da pensão direto na folha após estabilizar finanças." },
];

export function toLocalNoonISO(dateInput?: string) {
  if (!dateInput) {
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    return now.toISOString();
  }
  const datePart = dateInput.length <= 10 ? dateInput : dateInput.slice(0, 10);
  const [y, m, d] = datePart.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0).toISOString();
}

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}
