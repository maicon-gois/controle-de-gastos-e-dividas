import { useState } from "react";
import { Goal } from "@/lib/types";
import { X, Trash2 } from "lucide-react";

interface GoalModalProps {
  editingGoal?: Goal | null;
  onSave: (goal: Omit<Goal, "id" | "userId">) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const inputClass =
  "w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40";
const labelClass =
  "block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2";

function toDateInput(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export function GoalModal({ editingGoal, onSave, onDelete, onClose }: GoalModalProps) {
  const [title, setTitle] = useState(editingGoal?.title || "");
  const [targetAmount, setTargetAmount] = useState(
    String(editingGoal?.targetAmount ?? "")
  );
  const [savedAmount, setSavedAmount] = useState(
    String(editingGoal?.savedAmount ?? "0")
  );
  const [deadline, setDeadline] = useState(
    toDateInput(editingGoal?.deadline) ||
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState(editingGoal?.description || "");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(targetAmount);
    if (!title.trim() || !(target > 0) || !deadline) return;
    onSave({
      title: title.trim(),
      targetAmount: target,
      savedAmount: Number(savedAmount) || 0,
      deadline,
      description: description.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 backdrop-blur-sm safe-top"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {editingGoal ? "Editar meta" : "Nova meta"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className={labelClass}>Título</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="Ex: Reserva de emergência"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Valor alvo</label>
              <input
                type="number"
                step="0.01"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className={inputClass}
                placeholder="5000"
              />
            </div>
            <div>
              <label className={labelClass}>Já guardado</label>
              <input
                type="number"
                step="0.01"
                value={savedAmount}
                onChange={(e) => setSavedAmount(e.target.value)}
                className={inputClass}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Data alvo</label>
            <input
              type="date"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="opcional"
            />
          </div>

          <div className="flex gap-3 pt-2">
            {editingGoal && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(editingGoal.id);
                  onClose();
                }}
                className="p-3 bg-red-900/40 text-red-300 rounded-xl font-semibold hover:bg-red-900/60 transition-colors"
                aria-label="Excluir meta"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl font-semibold text-black bg-emerald-500 hover:bg-emerald-400 transition-colors"
            >
              {editingGoal ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
