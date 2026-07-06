import { TransactionType } from "@/lib/types";
import { ProfileId } from "@/lib/profiles";

export interface TimelineTemplate {
  id: string;
  label: string;
  type: TransactionType;
  categoryId: string;
  amount: number;
  description: string;
  tags?: string[];
}

const CASAL: TimelineTemplate[] = [
  { id: "t-sal-maicon", label: "Recebi o salário (Maicon)", type: "entrada", categoryId: "salario", amount: 2582.52, description: "Salário Maicon" },
  { id: "t-sal-gabi", label: "Recebi o salário (Gabrielle)", type: "entrada", categoryId: "renda-extra", amount: 1600, description: "Salário Gabrielle" },
  { id: "t-extra", label: "Entrou trabalho extra", type: "entrada", categoryId: "renda-extra", amount: 100, description: "Trabalho extra" },
  { id: "t-pensao", label: "Paguei a pensão", type: "saida", categoryId: "filhas", amount: 600, description: "Pensão Bia", tags: ["filhas"] },
  { id: "t-ajuda-pensao", label: "Paguei ajuda de custo da pensão", type: "saida", categoryId: "filhas", amount: 253, description: "Ajuda de custo pensão", tags: ["filhas"] },
  { id: "t-moradia", label: "Paguei moradia (Cibele)", type: "saida", categoryId: "moradia", amount: 320, description: "Moradia Cibele", tags: ["casa"] },
  { id: "t-luz", label: "Paguei a luz", type: "saida", categoryId: "moradia", amount: 300, description: "Luz", tags: ["casa", "essencial"] },
  { id: "t-internet", label: "Paguei a internet", type: "saida", categoryId: "telecom", amount: 116, description: "Internet", tags: ["casa", "assinaturas"] },
  { id: "t-vivo", label: "Paguei Vivo/celular", type: "saida", categoryId: "telecom", amount: 100, description: "Vivo", tags: ["assinaturas"] },
  { id: "t-faculdade", label: "Paguei faculdade", type: "saida", categoryId: "educacao", amount: 160, description: "Faculdade", tags: ["essencial"] },
  { id: "t-mercado", label: "Fiz mercado", type: "saida", categoryId: "mercado", amount: 400, description: "Mercado", tags: ["essencial"] },
];

const MAICON: TimelineTemplate[] = [
  { id: "t-sal", label: "Recebi o salário", type: "entrada", categoryId: "salario", amount: 2582.52, description: "Salário Maicon" },
  { id: "t-extra", label: "Entrou trabalho extra", type: "entrada", categoryId: "renda-extra", amount: 100, description: "Trabalho extra" },
  { id: "t-pensao", label: "Paguei a pensão", type: "saida", categoryId: "filhas", amount: 600, description: "Pensão Bia", tags: ["filhas"] },
  { id: "t-luz", label: "Paguei a luz", type: "saida", categoryId: "moradia", amount: 150, description: "Luz (minha parte)", tags: ["casa"] },
  { id: "t-internet", label: "Paguei a internet", type: "saida", categoryId: "telecom", amount: 58, description: "Internet", tags: ["assinaturas"] },
  { id: "t-vivo", label: "Paguei Vivo", type: "saida", categoryId: "telecom", amount: 100, description: "Vivo", tags: ["assinaturas"] },
  { id: "t-faculdade", label: "Paguei faculdade", type: "saida", categoryId: "educacao", amount: 160, description: "Faculdade", tags: ["essencial"] },
];

const GABRIELLE: TimelineTemplate[] = [
  { id: "t-sal", label: "Recebi o salário", type: "entrada", categoryId: "salario", amount: 1600, description: "Salário Gabrielle" },
  { id: "t-bolsa", label: "Entrou Bolsa Família", type: "entrada", categoryId: "renda-extra", amount: 600, description: "Bolsa Família" },
  { id: "t-aluguel", label: "Paguei aluguel", type: "saida", categoryId: "moradia", amount: 900, description: "Aluguel", tags: ["casa", "essencial"] },
  { id: "t-luz", label: "Paguei a luz", type: "saida", categoryId: "moradia", amount: 180, description: "Luz", tags: ["casa"] },
  { id: "t-internet", label: "Paguei internet", type: "saida", categoryId: "telecom", amount: 89.9, description: "Internet", tags: ["assinaturas"] },
  { id: "t-mercado", label: "Fiz mercado", type: "saida", categoryId: "mercado", amount: 450, description: "Mercado", tags: ["essencial"] },
];

const DEMO: TimelineTemplate[] = [
  { id: "t-sal", label: "Recebi o salário", type: "entrada", categoryId: "salario", amount: 3000, description: "Salário CLT" },
  { id: "t-aluguel", label: "Paguei aluguel", type: "saida", categoryId: "moradia", amount: 850, description: "Aluguel", tags: ["casa"] },
  { id: "t-luz", label: "Paguei a luz", type: "saida", categoryId: "moradia", amount: 145, description: "Luz", tags: ["casa"] },
  { id: "t-internet", label: "Paguei internet", type: "saida", categoryId: "telecom", amount: 99.9, description: "Internet", tags: ["assinaturas"] },
  { id: "t-mercado", label: "Fiz mercado", type: "saida", categoryId: "mercado", amount: 520, description: "Mercado", tags: ["essencial"] },
  { id: "t-extra", label: "Entrou renda extra", type: "entrada", categoryId: "renda-extra", amount: 200, description: "Renda extra" },
];

export function getTimelineTemplates(profileId: ProfileId): TimelineTemplate[] {
  switch (profileId) {
    case "casal": return CASAL;
    case "maicon": return MAICON;
    case "gabrielle": return GABRIELLE;
    case "demo": return DEMO;
  }
}
