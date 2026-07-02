import { Debt, Goal } from "@/lib/types";
import { AlertCircle, Target, TrendingDown, ArrowRight, Clock, ChevronDown, ChevronUp, Upload, Paperclip } from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface DebtsAndGoalsProps {
  debts: Debt[];
  goals: Goal[];
}

export function DebtsAndGoals({ debts, goals }: DebtsAndGoalsProps) {
  const totalDebts = debts.filter(d => d.status === 'atrasada' || d.status === 'em_negociacao').reduce((acc, curr) => acc + curr.amount, 0);
  const debtsList = [...debts].filter(d => d.status !== 'paga').sort((a, b) => b.amount - a.amount);

  const [expandedDebt, setExpandedDebt] = useState<string | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, debtId: string) => {
    if (e.target.files && e.target.files.length > 0) {
      alert(`Arquivo "${e.target.files[0].name}" anexado à dívida com sucesso!`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Debts Overview */}
        <div className="bg-gradient-to-br from-red-900/20 to-zinc-900/50 border border-red-900/30 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/20 text-red-400 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Contas Atrasadas</h2>
              <p className="text-sm text-zinc-400">Total a renegociar</p>
            </div>
          </div>
          <div className="text-4xl font-bold text-red-400 mb-2">
            <span className="text-2xl font-normal text-red-500/70 mr-1">R$</span>
            {totalDebts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Goals Overview */}
        <div className="bg-gradient-to-br from-emerald-900/20 to-zinc-900/50 border border-emerald-900/30 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Próximas Metas</h2>
              <p className="text-sm text-zinc-400">Objetivos financeiros</p>
            </div>
          </div>
          <div className="space-y-3">
            {goals.slice(0, 2).map((goal) => (
              <div key={goal.id} className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
                <span className="text-sm font-medium text-zinc-300 truncate mr-2">{goal.title}</span>
                <span className="text-sm font-bold text-emerald-400 whitespace-nowrap">
                  R$ {goal.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debts Ranking */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            Ranking de Dívidas & Estratégia
          </h3>
          <div className="space-y-4">
            {debtsList.map((debt, index) => {
              const isExpanded = expandedDebt === debt.id;
              
              return (
                <div key={debt.id} className={`rounded-2xl border transition-all ${debt.status === 'em_negociacao' ? 'bg-indigo-900/10 border-indigo-900/30' : debt.status === 'descontado_folha' ? 'bg-zinc-800/20 border-zinc-800/50' : 'bg-red-900/10 border-red-900/20'}`}>
                  <div 
                    className="p-4 cursor-pointer flex justify-between items-start"
                    onClick={() => setExpandedDebt(isExpanded ? null : debt.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold bg-zinc-800 text-zinc-400 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-zinc-200">{debt.creditor}</h4>
                        <p className="text-xs text-zinc-400 line-clamp-1">{debt.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold whitespace-nowrap ${debt.status === 'descontado_folha' ? 'text-zinc-500' : 'text-red-400'}`}>
                        R$ {debt.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-zinc-800/50">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-zinc-400 mb-1">Descrição Detalhada:</p>
                          <p className="text-sm text-zinc-200">{debt.description}</p>
                        </div>
                        
                        {debt.strategy && (
                          <div className="text-sm bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 text-zinc-300">
                            <div className="flex items-start gap-2">
                              <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-semibold text-emerald-500 mb-1">Estratégia Recomendada</p>
                                <p>{debt.strategy}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          {debt.status === 'atrasada' && (
                            <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded font-medium border border-red-500/20">
                              Atrasada
                            </span>
                          )}
                          {debt.status === 'em_negociacao' && (
                            <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded font-medium border border-indigo-500/20">
                              Em Negociação
                            </span>
                          )}
                          {debt.status === 'descontado_folha' && (
                            <span className="px-2 py-1 bg-zinc-500/10 text-zinc-400 text-xs rounded font-medium border border-zinc-500/20">
                              Descontado em Folha
                            </span>
                          )}
                          
                          <div className="flex-1"></div>
                          
                          <label className="cursor-pointer px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2">
                            <Upload className="w-3 h-3" />
                            Anexar Boleto/Contracheque
                            <input 
                              type="file" 
                              className="hidden" 
                              onChange={(e) => handleFileUpload(e, debt.id)}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Goals Planner */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Planejamento de Metas
          </h3>
          <div className="space-y-4">
            {goals.map((goal) => {
              const isExpanded = expandedGoal === goal.id;
              
              return (
                <div key={goal.id} className="rounded-2xl border bg-emerald-900/10 border-emerald-900/20 transition-all">
                  <div 
                    className="p-4 cursor-pointer flex justify-between items-start"
                    onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                  >
                    <div>
                      <h4 className="font-bold text-zinc-200">{goal.title}</h4>
                      {!isExpanded && goal.description && <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{goal.description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-400 whitespace-nowrap">
                        R$ {goal.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-emerald-900/20">
                      <div className="space-y-4">
                        {goal.description && (
                          <div>
                            <p className="text-sm text-zinc-400 mb-1">Descrição Detalhada:</p>
                            <p className="text-sm text-zinc-200">{goal.description}</p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                            <p className="text-xs text-zinc-500 mb-1">Valor Guardado</p>
                            <p className="font-bold text-emerald-400">R$ {goal.savedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                            <p className="text-xs text-zinc-500 mb-1">Restante</p>
                            <p className="font-bold text-zinc-300">R$ {(goal.targetAmount - goal.savedAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-zinc-400">
                            <Clock className="w-4 h-4" />
                            <span>Data Alvo: <span className="text-zinc-200 font-medium">{format(parseISO(goal.deadline), "dd/MM/yyyy", { locale: ptBR })}</span></span>
                          </div>
                          <span className="text-emerald-400/80 font-medium">
                            {formatDistanceToNow(parseISO(goal.deadline), { locale: ptBR, addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
