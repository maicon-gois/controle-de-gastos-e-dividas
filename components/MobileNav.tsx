"use client";

import {
  LayoutList,
  Table2,
  CalendarClock,
  AlertTriangle,
  PieChart,
  Calculator,
  Activity,
} from "lucide-react";

const TABS = [
  { value: "linha-do-tempo", label: "Tempo", icon: Activity },
  { value: "planilha", label: "Planilha", icon: Table2 },
  { value: "lista", label: "Lista", icon: LayoutList },
  { value: "projecao", label: "Projeção", icon: CalendarClock },
  { value: "dividas-metas", label: "Dívidas", icon: AlertTriangle },
  { value: "analise", label: "Análise", icon: PieChart },
  { value: "calculadora", label: "Calc", icon: Calculator },
] as const;

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 safe-bottom">
      <div className="flex items-stretch justify-around px-1 pt-1 overflow-x-auto no-scrollbar">
        {TABS.map(({ value, label, icon: Icon }) => {
          const active = activeTab === value;
          return (
            <button
              key={value}
              onClick={() => onTabChange(value)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-w-[52px] py-2 min-h-[52px] rounded-lg transition-colors ${
                active ? "text-green-400" : "text-zinc-500"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "scale-110" : ""} transition-transform`} />
              <span className="text-[10px] font-semibold leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export { TABS };
