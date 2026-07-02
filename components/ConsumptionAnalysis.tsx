"use client";

import { Transaction, Debt, Goal, CATEGORIES } from "@/lib/types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  AlertTriangle,
  Target,
} from "lucide-react";

interface ConsumptionAnalysisProps {
  transactions: Transaction[];
  debts: Debt[];
  goals: Goal[];
  monthLabel?: string;
}

const COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#64748b",
  "#a855f7",
  "#0ea5e9",
  "#eab308",
];

const brl = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export function ConsumptionAnalysis({
  transactions,
  debts,
  goals,
  monthLabel,
}: ConsumptionAnalysisProps) {
  const entradas = transactions.filter((t) => t.type === "entrada");
  const saidas = transactions.filter((t) => t.type === "saida");

  const totalEntradas = entradas.reduce((a, b) => a + b.amount, 0);
  const totalSaidas = saidas.reduce((a, b) => a + b.amount, 0);
  const saldo = totalEntradas - totalSaidas;
  const savingsRate = totalEntradas > 0 ? (saldo / totalEntradas) * 100 : 0;

  // ---- Despesas por CATEGORIA (primário) ----
  const catTotals: Record<string, number> = {};
  saidas.forEach((s) => {
    const key = s.categoryId || "outros";
    catTotals[key] = (catTotals[key] || 0) + s.amount;
  });
  const categoryData = Object.keys(catTotals)
    .map((catId, idx) => {
      const cat = CATEGORIES.find((c) => c.id === catId);
      return {
        id: catId,
        name: cat?.name || catId,
        value: catTotals[catId],
        color: COLORS[idx % COLORS.length],
        pct: totalSaidas > 0 ? (catTotals[catId] / totalSaidas) * 100 : 0,
      };
    })
    .sort((a, b) => b.value - a.value)
    .map((item, idx) => ({ ...item, color: COLORS[idx % COLORS.length] }));

  // ---- Despesas por TAG (secundário) ----
  const tagTotals: Record<string, number> = {};
  saidas.forEach((s) => {
    if (s.tags && s.tags.length > 0) {
      s.tags.forEach((tag) => {
        tagTotals[tag] = (tagTotals[tag] || 0) + s.amount;
      });
    } else {
      tagTotals["sem tag"] = (tagTotals["sem tag"] || 0) + s.amount;
    }
  });
  const tagData = Object.keys(tagTotals)
    .map((tag) => ({
      name: tag.charAt(0).toUpperCase() + tag.slice(1),
      value: tagTotals[tag],
    }))
    .sort((a, b) => b.value - a.value);

  // ---- Top despesas individuais ----
  const topExpenses = [...saidas].sort((a, b) => b.amount - a.amount).slice(0, 5);

  // ---- Dívidas (visão global) ----
  const activeDebts = debts.filter(
    (d) => d.status === "atrasada" || d.status === "em_negociacao"
  );
  const totalActiveDebts = activeDebts.reduce((a, b) => a + b.amount, 0);
  const totalPayrollDebts = debts
    .filter((d) => d.status === "descontado_folha")
    .reduce((a, b) => a + b.amount, 0);

  // ---- Metas ----
  const totalGoalTarget = goals.reduce((a, b) => a + b.targetAmount, 0);
  const totalGoalSaved = goals.reduce((a, b) => a + b.savedAmount, 0);
  const goalProgress =
    totalGoalTarget > 0 ? (totalGoalSaved / totalGoalTarget) * 100 : 0;

  const hasData = transactions.length > 0;

  return (
    <div className="space-y-8">
      {/* KPIs do mês */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Visão Consolidada</h3>
          {monthLabel && (
            <span className="text-xs text-zinc-500 uppercase tracking-widest">
              {monthLabel}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Receitas"
            value={brl(totalEntradas)}
            icon={<TrendingUp className="w-4 h-4" />}
            tone="green"
          />
          <KpiCard
            label="Despesas"
            value={brl(totalSaidas)}
            icon={<TrendingDown className="w-4 h-4" />}
            tone="red"
          />
          <KpiCard
            label="Saldo do Mês"
            value={brl(saldo)}
            icon={<Wallet className="w-4 h-4" />}
            tone={saldo >= 0 ? "green" : "red"}
          />
          <KpiCard
            label="Taxa de Poupança"
            value={`${savingsRate.toFixed(1)}%`}
            icon={<PiggyBank className="w-4 h-4" />}
            tone={savingsRate >= 0 ? "emerald" : "red"}
          />
        </div>
      </div>

      {!hasData ? (
        <div className="text-zinc-500 text-center py-10 border border-dashed border-zinc-800 rounded-3xl">
          Nenhum lançamento neste mês para analisar.
        </div>
      ) : (
        <>
          {/* Despesas por categoria */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">
              Despesas por Categoria
            </h3>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="w-full md:w-1/2 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="transparent"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => brl(Number(value))}
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "12px",
                      }}
                      itemStyle={{ color: "#e4e4e7" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full md:w-1/2 space-y-2">
                {categoryData.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-zinc-300 font-medium">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">
                          {brl(item.value)}
                        </span>
                        <span className="text-zinc-500 text-xs w-12 text-right">
                          {item.pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.pct}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tags + Top despesas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Consumo por Tag
              </h3>
              <div className="space-y-3">
                {tagData.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800"
                  >
                    <span className="text-zinc-300 font-medium">{item.name}</span>
                    <span className="text-white font-semibold">
                      {brl(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Maiores Despesas
              </h3>
              <div className="space-y-3">
                {topExpenses.map((t, idx) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold bg-zinc-800 text-zinc-400 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-zinc-300 font-medium">
                        {t.description}
                      </span>
                    </div>
                    <span className="text-red-400 font-semibold whitespace-nowrap">
                      {brl(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Panorama geral: dívidas + metas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-red-900/20 to-zinc-900/50 border border-red-900/30 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/20 text-red-400 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Panorama de Dívidas</h3>
          </div>
          <div className="space-y-3">
            <Row label="A renegociar (ativas)" value={brl(totalActiveDebts)} tone="red" />
            <Row label="Descontado em folha" value={brl(totalPayrollDebts)} tone="zinc" />
            <div className="pt-2 border-t border-zinc-800">
              <Row
                label="Comprometimento vs. receita do mês"
                value={
                  totalEntradas > 0
                    ? `${((totalActiveDebts / totalEntradas) * 100).toFixed(0)}%`
                    : "-"
                }
                tone="red"
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-900/20 to-zinc-900/50 border border-emerald-900/30 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Progresso das Metas</h3>
          </div>
          <div className="space-y-3">
            <Row label="Guardado" value={brl(totalGoalSaved)} tone="emerald" />
            <Row label="Objetivo total" value={brl(totalGoalTarget)} tone="zinc" />
            <div className="pt-1">
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Progresso</span>
                <span>{goalProgress.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(goalProgress, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "green" | "red" | "emerald";
}) {
  const tones: Record<string, string> = {
    green: "text-green-400",
    red: "text-red-400",
    emerald: "text-emerald-400",
  };
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2 text-zinc-500">
        <span className="text-[11px] font-bold uppercase tracking-widest">
          {label}
        </span>
        <span className={tones[tone]}>{icon}</span>
      </div>
      <div className={`text-xl font-bold ${tones[tone]}`}>{value}</div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "red" | "emerald" | "zinc";
}) {
  const tones: Record<string, string> = {
    red: "text-red-400",
    emerald: "text-emerald-400",
    zinc: "text-zinc-300",
  };
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className={`font-semibold ${tones[tone]}`}>{value}</span>
    </div>
  );
}
