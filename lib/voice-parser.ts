import { TransactionType } from "@/lib/types";
import { TimelineTemplate } from "@/lib/timeline-templates";

export interface ParsedVoiceEvent {
  type: TransactionType;
  description: string;
  amount: number;
  categoryId: string;
  tags?: string[];
}

const CATEGORY_RULES: {
  pattern: RegExp;
  categoryId: string;
  type: TransactionType;
  description: string;
  defaultAmount?: number;
  tags?: string[];
}[] = [
  { pattern: /sal[aá]rio/i, categoryId: "salario", type: "entrada", description: "Salário", defaultAmount: 1500 },
  { pattern: /pens[aã]o/i, categoryId: "filhas", type: "saida", description: "Pensão", defaultAmount: 600, tags: ["filhas"] },
  { pattern: /ajuda de custo/i, categoryId: "filhas", type: "saida", description: "Ajuda de custo pensão", tags: ["filhas"] },
  { pattern: /\bluz\b|energia|ceee/i, categoryId: "moradia", type: "saida", description: "Luz", defaultAmount: 300, tags: ["casa", "essencial"] },
  { pattern: /internet|osir|wi-?fi|fibra/i, categoryId: "telecom", type: "saida", description: "Internet", defaultAmount: 116, tags: ["assinaturas"] },
  { pattern: /vivo|claro|tim|celular|telefone/i, categoryId: "telecom", type: "saida", description: "Celular", defaultAmount: 100, tags: ["assinaturas"] },
  { pattern: /faculdade|escola|curso/i, categoryId: "educacao", type: "saida", description: "Faculdade", defaultAmount: 160, tags: ["essencial"] },
  { pattern: /moradia|aluguel|cibele/i, categoryId: "moradia", type: "saida", description: "Moradia", defaultAmount: 320, tags: ["casa"] },
  { pattern: /mercado|supermercado/i, categoryId: "mercado", type: "saida", description: "Mercado", defaultAmount: 400, tags: ["essencial"] },
  { pattern: /m[aã]e\b|minha m[aã]e/i, categoryId: "filhas", type: "saida", description: "Para mãe", tags: ["filhas"] },
  { pattern: /pizza|lanche|ifood|delivery|alimenta/i, categoryId: "alimentacao", type: "saida", description: "Alimentação", defaultAmount: 50 },
  { pattern: /extra|freela|bico|trabalho extra|renda extra/i, categoryId: "renda-extra", type: "entrada", description: "Renda extra", defaultAmount: 100 },
  { pattern: /bolsa fam[ií]lia/i, categoryId: "renda-extra", type: "entrada", description: "Bolsa Família", defaultAmount: 600 },
  { pattern: /combust[ií]vel|gasolina|uber|transporte/i, categoryId: "transporte", type: "saida", description: "Transporte", defaultAmount: 80 },
  { pattern: /farm[aá]cia|rem[eé]dio|sa[uú]de/i, categoryId: "saude", type: "saida", description: "Saúde", defaultAmount: 50, tags: ["saúde"] },
  { pattern: /netflix|spotify|streaming|assinatura/i, categoryId: "ferramentas", type: "saida", description: "Assinatura", defaultAmount: 50, tags: ["assinaturas"] },
];

const INCOME_VERBS = /recebi|ganhei|entrou|caiu|depositou|creditou/i;
const EXPENSE_VERBS = /paguei|pague|gastei|dei|comprei|transferi/i;

function parseAmount(text: string): number | null {
  const m1 = text.match(/r\$\s*([\d.,]+)/i);
  if (m1) return parseBrNumber(m1[1]);

  const m2 = text.match(/([\d.,]+)\s*reais?/i);
  if (m2) return parseBrNumber(m2[1]);

  const m3 = text.match(/\b(\d{1,5}(?:[.,]\d{1,2})?)\b/);
  if (m3) return parseBrNumber(m3[1]);

  return null;
}

function parseBrNumber(s: string): number {
  const cleaned = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function splitClauses(text: string): string[] {
  let t = text.toLowerCase().trim();
  t = t.replace(/^(hoje|agora|ontem|acabei de)\s+,?\s*/gi, "");

  // "paguei a pensão a luz" → separa antes de categorias encadeadas com " a "
  t = t.replace(
    /\s+a\s+(?=(?:luz|internet|vivo|pens[aã]o|faculdade|mercado|aluguel|celular)\b)/gi,
    ", "
  );

  const parts = t.split(/,\s*|\s+e\s+(?=(?:recebi|paguei|ganhei|gastei|dei|entrou|comprei))/i);
  return parts.map((p) => p.trim()).filter((p) => p.length > 2);
}

function inferType(clause: string): TransactionType {
  if (INCOME_VERBS.test(clause)) return "entrada";
  if (EXPENSE_VERBS.test(clause)) return "saida";
  return "saida";
}

function matchCategory(clause: string, type: TransactionType) {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(clause) && rule.type === type) return rule;
  }
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(clause)) return rule;
  }
  return null;
}

function matchTemplate(clause: string, templates: TimelineTemplate[]): TimelineTemplate | null {
  const lower = clause.toLowerCase();
  for (const t of templates) {
    const keywords = t.label.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const hits = keywords.filter((k) => lower.includes(k));
    if (hits.length >= 2) return t;
  }
  return null;
}

function parseClause(clause: string, templates: TimelineTemplate[]): ParsedVoiceEvent | null {
  const type = inferType(clause);
  const amount = parseAmount(clause);

  const tmpl = matchTemplate(clause, templates);
  if (tmpl) {
    return {
      type: tmpl.type,
      description: tmpl.description,
      amount: amount ?? tmpl.amount,
      categoryId: tmpl.categoryId,
      tags: tmpl.tags,
    };
  }

  const rule = matchCategory(clause, type);
  if (rule) {
    return {
      type: rule.type,
      description: rule.description,
      amount: amount ?? rule.defaultAmount ?? 0,
      categoryId: rule.categoryId,
      tags: rule.tags,
    };
  }

  if (amount && amount > 0) {
    const desc = clause.replace(/^(recebi|paguei|ganhei|gastei|dei|entrou|comprei)\s+/i, "").trim();
    return {
      type,
      description: desc || (type === "entrada" ? "Entrada" : "Despesa"),
      amount,
      categoryId: type === "entrada" ? "renda-extra" : "outros",
    };
  }

  return null;
}

/** Interpreta texto de voz em português e retorna eventos financeiros. */
export function parseVoiceText(text: string, templates: TimelineTemplate[] = []): ParsedVoiceEvent[] {
  if (!text.trim()) return [];

  const clauses = splitClauses(text);
  const events: ParsedVoiceEvent[] = [];
  const seen = new Set<string>();

  for (const clause of clauses) {
    const event = parseClause(clause, templates);
    if (!event || event.amount <= 0) continue;
    const key = `${event.type}|${event.description}|${event.amount}`;
    if (seen.has(key)) continue;
    seen.add(key);
    events.push(event);
  }

  return events;
}
