import { useState } from "react";
import { PlannedPurchase, PurchasePriority } from "@/lib/types";
import { X, Trash2 } from "lucide-react";

interface PurchaseModalProps {
  editingPurchase?: PlannedPurchase | null;
  onSave: (purchase: Omit<PlannedPurchase, "id" | "userId" | "profileId">) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const inputClass =
  "w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40";
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

export function PurchaseModal({
  editingPurchase,
  onSave,
  onDelete,
  onClose,
}: PurchaseModalProps) {
  const [name, setName] = useState(editingPurchase?.name || "");
  const [estimatedAmount, setEstimatedAmount] = useState(
    String(editingPurchase?.estimatedAmount ?? "")
  );
  const [savedAmount, setSavedAmount] = useState(
    String(editingPurchase?.savedAmount ?? "0")
  );
  const [targetDate, setTargetDate] = useState(
    toDateInput(editingPurchase?.targetDate) ||
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString().slice(0, 10)
  );
  const [priority, setPriority] = useState<PurchasePriority>(
    editingPurchase?.priority || "media"
  );
  const [notes, setNotes] = useState(editingPurchase?.notes || "");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const estimated = Number(estimatedAmount);
    if (!name.trim() || !(estimated > 0) || !targetDate) return;
    onSave({
      name: name.trim(),
      estimatedAmount: estimated,
      savedAmount: Number(savedAmount) || 0,
      targetDate,
      priority,
      notes: notes.trim() || undefined,
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
            {editingPurchase ? "Editar compra" : "Nova compra futura"}
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
            <label className={labelClass}>Nome do item</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Ex: Geladeira nova"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Valor estimado</label>
              <input
                type="number"
                step="0.01"
                required
                value={estimatedAmount}
                onChange={(e) => setEstimatedAmount(e.target.value)}
                className={inputClass}
                placeholder="2500"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Data alvo</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PurchasePriority)}
                className={inputClass}
              >
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="opcional"
            />
          </div>

          <div className="flex gap-3 pt-2">
            {editingPurchase && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(editingPurchase.id);
                  onClose();
                }}
                className="p-3 bg-red-900/40 text-red-300 rounded-xl font-semibold hover:bg-red-900/60 transition-colors"
                aria-label="Excluir compra"
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
              className="flex-1 py-3 rounded-xl font-semibold text-black bg-sky-500 hover:bg-sky-400 transition-colors"
            >
              {editingPurchase ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
