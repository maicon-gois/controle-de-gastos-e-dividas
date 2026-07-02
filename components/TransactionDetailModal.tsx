import { useState, useEffect } from "react";
import { Transaction, CATEGORIES, TAGS } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface TransactionDetailModalProps {
  transaction: Transaction;
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export function TransactionDetailModal({
  transaction,
  onUpdate,
  onRemove,
  onClose,
}: TransactionDetailModalProps) {
  const [type, setType] = useState(transaction.type);
  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [categoryId, setCategoryId] = useState(transaction.categoryId);
  const [selectedTags, setSelectedTags] = useState<string[]>(transaction.tags ?? []);
  const [date, setDate] = useState(format(parseISO(transaction.date), "yyyy-MM-dd"));
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setType(transaction.type);
    setDescription(transaction.description);
    setAmount(String(transaction.amount));
    setCategoryId(transaction.categoryId);
    setSelectedTags(transaction.tags ?? []);
    setDate(format(parseISO(transaction.date), "yyyy-MM-dd"));
    setConfirmDelete(false);
  }, [transaction]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    onUpdate(transaction.id, {
      type,
      description,
      amount: Number(amount),
      categoryId,
      tags: selectedTags.length > 0 ? selectedTags : [],
      date,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onRemove(transaction.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 backdrop-blur-sm safe-top" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-6 w-full sm:max-w-md shadow-2xl safe-bottom max-h-[92dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b border-zinc-800 flex items-center justify-between ${
          type === "entrada" ? "bg-green-500/5" : "bg-red-500/5"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              type === "entrada" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
            }`}>
              {type === "entrada" ? (
                <ArrowUpCircle className="w-5 h-5" />
              ) : (
                <ArrowDownCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {type === "entrada" ? "Entrada" : "Saída"}
              </h2>
              <p className="text-xs text-zinc-500">
                {format(parseISO(transaction.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2 p-1 bg-zinc-950 rounded-xl">
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${
                type === "entrada"
                  ? "bg-green-500 text-black shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              onClick={() => setType("entrada")}
            >
              Entrada
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${
                type === "saida"
                  ? "bg-red-500 text-black shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              onClick={() => setType("saida")}
            >
              Saída
            </button>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Descrição
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 ${
                type === "entrada" ? "focus:ring-green-500/50" : "focus:ring-red-500/50"
              }`}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Data
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Categoria
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 appearance-none"
            >
              {CATEGORIES.filter(
                (c) => c.type === type || c.type === "ambos"
              ).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      isSelected
                        ? "bg-indigo-500 text-white"
                        : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 border border-zinc-800"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${
                confirmDelete
                  ? "bg-red-600 text-white hover:bg-red-500"
                  : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              {confirmDelete ? "Confirmar" : "Excluir"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`flex-1 py-3 rounded-xl font-semibold text-black transition-colors ${
                type === "entrada"
                  ? "bg-green-500 hover:bg-green-400"
                  : "bg-red-500 hover:bg-red-400"
              }`}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
