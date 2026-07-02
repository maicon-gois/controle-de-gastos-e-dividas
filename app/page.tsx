"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  LayoutList,
  Table2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Calculator as CalculatorIcon,
  PieChart as PieChartIcon,
  CalendarClock,
  LogOut,
} from "lucide-react";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { TransactionList } from "@/components/TransactionList";
import { SpreadsheetView } from "@/components/SpreadsheetView";
import { DebtsAndGoals } from "@/components/DebtsAndGoals";
import { Calculator } from "@/components/Calculator";
import { ConsumptionAnalysis } from "@/components/ConsumptionAnalysis";
import { ProjectionPlanner } from "@/components/ProjectionPlanner";
import { LoginForm } from "@/components/LoginForm";
import { MobileNav } from "@/components/MobileNav";
import * as Tabs from "@radix-ui/react-tabs";

export default function Home() {
  const {
    transactions,
    debts,
    goals,
    addTransaction,
    removeTransaction,
    updateTransaction,
    generateStandardTransactions,
    isLoaded,
    user,
    login,
    signOut,
    loginError,
    loginLoading,
  } = useTransactions();

  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(7);
  const [activeTab, setActiveTab] = useState("planilha");

  if (!isLoaded) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--color-dark)] text-white safe-top safe-bottom">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Wallet className="w-12 h-12 text-zinc-600" />
          <p className="text-zinc-500 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={login} error={loginError} loading={loginLoading} />;
  }

  const filteredTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
  });

  const saldo = filteredTransactions.reduce(
    (acc, curr) => (curr.type === "entrada" ? acc + curr.amount : acc - curr.amount),
    0
  );
  const totalEntradas = filteredTransactions
    .filter((t) => t.type === "entrada")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalSaidas = filteredTransactions
    .filter((t) => t.type === "saida")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const months = [
    { value: 1, label: "Jan" }, { value: 2, label: "Fev" }, { value: 3, label: "Mar" },
    { value: 4, label: "Abr" }, { value: 5, label: "Mai" }, { value: 6, label: "Jun" },
    { value: 7, label: "Jul" }, { value: 8, label: "Ago" }, { value: 9, label: "Set" },
    { value: 10, label: "Out" }, { value: 11, label: "Nov" }, { value: 12, label: "Dez" },
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const monthLabel = months.find((m) => m.value === selectedMonth)?.label;

  const tabTriggerClass =
    "flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 data-[state=active]:bg-zinc-800 data-[state=active]:text-white border border-transparent transition-all";

  return (
    <main className="min-h-[100dvh] bg-[var(--color-dark)] text-zinc-100 flex flex-col items-center safe-top">
      <div className="w-full max-w-5xl px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-24">
        {/* Month selector */}
        <div className="flex items-center justify-between bg-zinc-900/50 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-zinc-800">
          <button
            onClick={handlePrevMonth}
            className="p-2.5 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-white flex gap-2 items-center">
            <span className="text-zinc-400">{monthLabel}</span>
            <span>{selectedYear}</span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2.5 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="bg-zinc-900/40 border border-dashed border-zinc-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4">
            <Wand2 className="w-8 h-8 text-zinc-500" />
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Mês vazio</h2>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                Preencher com contas padrão (Salários, Moradia, Luz, Internet, Vivo, Faculdade, Pensão)?
              </p>
            </div>
            <button
              onClick={() => generateStandardTransactions(selectedYear, selectedMonth)}
              className="px-6 py-3 bg-zinc-100 hover:bg-white text-black font-semibold rounded-xl transition-colors flex items-center gap-2 min-h-[44px]"
            >
              <Wand2 className="w-4 h-4" />
              Preencher Contas Padrão
            </button>
          </div>
        )}

        {/* Header */}
        <header className="flex flex-col gap-4 sm:gap-6 bg-zinc-900/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-800/80 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400">
              <Wallet className="w-5 h-5" />
              <span className="font-semibold tracking-widest uppercase text-xs sm:text-sm">
                Dashboard
              </span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-xs px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors font-medium text-zinc-300 min-h-[36px]"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              Saldo do Mês
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white flex items-baseline gap-1 mt-1">
              <span className="text-zinc-600 font-normal text-2xl sm:text-3xl">R$</span>
              {saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-[#1b211a] to-[#0e110e] border border-[#2e3b2e] p-4 sm:p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs font-bold text-[#a7b8a7] uppercase tracking-widest">
                  Receitas
                </span>
                <TrendingUp className="w-4 h-4 text-[#8ec88e]" />
              </div>
              <div className="text-lg sm:text-2xl font-bold text-[#b4deb4]">
                R$ {totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#2a1b1b] to-[#140d0d] border border-[#3d2424] p-4 sm:p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs font-bold text-[#c29696] uppercase tracking-widest">
                  Despesas
                </span>
                <TrendingDown className="w-4 h-4 text-[#e38d8d]" />
              </div>
              <div className="text-lg sm:text-2xl font-bold text-[#e8b5b5]">
                R$ {totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop tab bar */}
          <Tabs.List className="hidden md:flex overflow-x-auto no-scrollbar gap-2 mb-4">
            <Tabs.Trigger value="lista" className={tabTriggerClass}>
              <LayoutList className="w-4 h-4" /> Lista
            </Tabs.Trigger>
            <Tabs.Trigger value="planilha" className={tabTriggerClass}>
              <Table2 className="w-4 h-4" /> Planilha
            </Tabs.Trigger>
            <Tabs.Trigger value="projecao" className={`${tabTriggerClass} data-[state=active]:bg-emerald-900/20 data-[state=active]:text-emerald-400`}>
              <CalendarClock className="w-4 h-4" /> Projeção
            </Tabs.Trigger>
            <Tabs.Trigger value="dividas-metas" className={`${tabTriggerClass} data-[state=active]:bg-purple-900/20 data-[state=active]:text-purple-400`}>
              <AlertTriangle className="w-4 h-4" /> Dívidas & Metas
            </Tabs.Trigger>
            <Tabs.Trigger value="calculadora" className={`${tabTriggerClass} data-[state=active]:bg-indigo-900/20 data-[state=active]:text-indigo-400`}>
              <CalculatorIcon className="w-4 h-4" /> Calculadora
            </Tabs.Trigger>
            <Tabs.Trigger value="analise" className={`${tabTriggerClass} data-[state=active]:bg-pink-900/20 data-[state=active]:text-pink-400`}>
              <PieChartIcon className="w-4 h-4" /> Análise
            </Tabs.Trigger>
          </Tabs.List>

          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 min-h-[300px]">
            <Tabs.Content value="lista" className="focus:outline-none">
              <TransactionList
                transactions={filteredTransactions}
                onRemove={removeTransaction}
                onUpdate={updateTransaction}
              />
            </Tabs.Content>
            <Tabs.Content value="planilha" className="focus:outline-none overflow-x-auto -mx-2 px-2">
              <SpreadsheetView
                transactions={filteredTransactions}
                onAdd={addTransaction}
                onUpdate={updateTransaction}
                onRemove={removeTransaction}
              />
            </Tabs.Content>
            <Tabs.Content value="projecao" className="focus:outline-none">
              <ProjectionPlanner
                transactions={transactions}
                debts={debts}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                userId={user.uid}
              />
            </Tabs.Content>
            <Tabs.Content value="dividas-metas" className="focus:outline-none">
              <DebtsAndGoals debts={debts} goals={goals} />
            </Tabs.Content>
            <Tabs.Content value="calculadora" className="focus:outline-none flex justify-center py-4 sm:py-8">
              <Calculator />
            </Tabs.Content>
            <Tabs.Content value="analise" className="focus:outline-none py-4 sm:py-8">
              <ConsumptionAnalysis
                transactions={filteredTransactions}
                debts={debts}
                goals={goals}
                monthLabel={`${monthLabel} ${selectedYear}`}
              />
            </Tabs.Content>
          </div>
        </Tabs.Root>
      </div>

      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
      <AddTransactionModal onAdd={addTransaction} />
    </main>
  );
}
