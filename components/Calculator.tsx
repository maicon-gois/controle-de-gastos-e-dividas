import { useState } from "react";
import { Delete } from "lucide-react";

export function Calculator() {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");

  const handleNumber = (num: string) => {
    setDisplay(display === "0" ? num : display + num);
  };

  const handleOperator = (op: string) => {
    setExpression(display + " " + op + " ");
    setDisplay("0");
  };

  const calculate = () => {
    try {
      // Evaluate expression safely
      const fullExpression = expression + display;
      // Replace x with * for JS eval, replace ÷ with /
      const sanitize = fullExpression.replace(/x/g, "*").replace(/÷/g, "/").replace(/,/g, ".");
      // eslint-disable-next-line no-eval
      const result = eval(sanitize);
      setDisplay(String(result).replace(/\./g, ","));
      setExpression("");
    } catch {
      setDisplay("Erro");
      setTimeout(() => setDisplay("0"), 1500);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setExpression("");
  };

  const handleBackspace = () => {
    setDisplay(display.length > 1 ? display.slice(0, -1) : "0");
  };

  const buttons = [
    { label: "C", onClick: handleClear, className: "bg-red-500/10 text-red-500 hover:bg-red-500/20" },
    { label: <Delete className="w-5 h-5 mx-auto" />, onClick: handleBackspace, className: "bg-zinc-800 text-zinc-400 hover:bg-zinc-700" },
    { label: "%", onClick: () => handleOperator("/ 100 *"), className: "bg-zinc-800 text-zinc-400 hover:bg-zinc-700" },
    { label: "÷", onClick: () => handleOperator("÷"), className: "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xl" },
    
    { label: "7", onClick: () => handleNumber("7"), className: "bg-zinc-900 text-zinc-200 hover:bg-zinc-800 text-xl" },
    { label: "8", onClick: () => handleNumber("8"), className: "bg-zinc-900 text-zinc-200 hover:bg-zinc-800 text-xl" },
    { label: "9", onClick: () => handleNumber("9"), className: "bg-zinc-900 text-zinc-200 hover:bg-zinc-800 text-xl" },
    { label: "x", onClick: () => handleOperator("x"), className: "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xl" },
    
    { label: "4", onClick: () => handleNumber("4"), className: "bg-zinc-900 text-zinc-200 hover:bg-zinc-800 text-xl" },
    { label: "5", onClick: () => handleNumber("5"), className: "bg-zinc-900 text-zinc-200 hover:bg-zinc-800 text-xl" },
    { label: "6", onClick: () => handleNumber("6"), className: "bg-zinc-900 text-zinc-200 hover:bg-zinc-800 text-xl" },
    { label: "-", onClick: () => handleOperator("-"), className: "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-2xl" },
    
    { label: "1", onClick: () => handleNumber("1"), className: "bg-zinc-900 text-zinc-200 hover:bg-zinc-800 text-xl" },
    { label: "2", onClick: () => handleNumber("2"), className: "bg-zinc-900 text-zinc-200 hover:bg-zinc-800 text-xl" },
    { label: "3", onClick: () => handleNumber("3"), className: "bg-zinc-900 text-zinc-200 hover:bg-zinc-800 text-xl" },
    { label: "+", onClick: () => handleOperator("+"), className: "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xl" },
    
    { label: "0", onClick: () => handleNumber("0"), className: "bg-zinc-900 text-zinc-200 hover:bg-zinc-800 text-xl col-span-2" },
    { label: ",", onClick: () => handleNumber(","), className: "bg-zinc-900 text-zinc-200 hover:bg-zinc-800 text-xl" },
    { label: "=", onClick: calculate, className: "bg-indigo-500 text-white hover:bg-indigo-600 text-xl font-bold shadow-lg shadow-indigo-500/20" },
  ];

  return (
    <div className="max-w-xs mx-auto w-full bg-zinc-950 p-6 rounded-[2.5rem] border-[8px] border-zinc-900 shadow-2xl">
      <div className="bg-zinc-900/50 p-4 rounded-3xl mb-6 h-28 flex flex-col items-end justify-end border border-zinc-800">
        <span className="text-zinc-500 text-sm h-5 font-medium tracking-wider">{expression}</span>
        <span className="text-white text-5xl font-light tracking-tighter truncate w-full text-right overflow-hidden">{display}</span>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        {buttons.map((btn, idx) => (
          <button
            key={idx}
            onClick={btn.onClick}
            className={`h-16 rounded-2xl flex items-center justify-center font-medium transition-all active:scale-95 ${btn.className}`}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
