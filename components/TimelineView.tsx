"use client";

import { useState, useRef, useCallback } from "react";
import { Transaction, TransactionType } from "@/lib/types";
import { ProfileId } from "@/lib/profiles";
import { getTimelineTemplates, TimelineTemplate } from "@/lib/timeline-templates";
import { parseVoiceText, ParsedVoiceEvent } from "@/lib/voice-parser";
import { useTimeline, TimelineEvent } from "@/hooks/useTimeline";
import { genId } from "@/lib/seed-data";
import {
  Mic,
  MicOff,
  Plus,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Clock,
  X,
  Trash2,
  Sparkles,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimelineViewProps {
  profileId: ProfileId;
  userId: string;
  year: number;
  month: number;
  onAddTransaction: (
    t: Omit<Transaction, "id" | "date"> & { id?: string; date?: string }
  ) => Promise<void>;
  onRemoveTransaction: (id: string) => Promise<void>;
}

const brl = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function TimelineView({
  profileId,
  userId,
  year,
  month,
  onAddTransaction,
  onRemoveTransaction,
}: TimelineViewProps) {
  const templates = getTimelineTemplates(profileId);
  const { events, addEvent, removeEvent, confirmedTemplateIds } = useTimeline(
    userId,
    profileId,
    year,
    month
  );

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voicePreview, setVoicePreview] = useState<ParsedVoiceEvent[] | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customDesc, setCustomDesc] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [customType, setCustomType] = useState<TransactionType>("saida");
  const [editingTemplate, setEditingTemplate] = useState<TimelineTemplate | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const totalEntradas = events
    .filter((e) => e.type === "entrada")
    .reduce((a, e) => a + e.amount, 0);
  const totalSaidas = events
    .filter((e) => e.type === "saida")
    .reduce((a, e) => a + e.amount, 0);
  const saldo = totalEntradas - totalSaidas;

  const pendingTemplates = templates.filter((t) => !confirmedTemplateIds.includes(t.id));

  const confirmEvent = useCallback(
    async (data: {
      type: TransactionType;
      description: string;
      amount: number;
      categoryId: string;
      templateId?: string;
      tags?: string[];
    }) => {
      const txId = genId();
      await onAddTransaction({
        id: txId,
        type: data.type,
        description: data.description,
        amount: data.amount,
        categoryId: data.categoryId,
        tags: data.tags,
      });
      addEvent({
        templateId: data.templateId,
        type: data.type,
        description: data.description,
        amount: data.amount,
        categoryId: data.categoryId,
        transactionId: txId,
        tags: data.tags,
      });
    },
    [onAddTransaction, addEvent]
  );

  const handleTemplateConfirm = async (tmpl: TimelineTemplate, amount?: number) => {
    await confirmEvent({
      type: tmpl.type,
      description: tmpl.description,
      amount: amount ?? tmpl.amount,
      categoryId: tmpl.categoryId,
      templateId: tmpl.id,
      tags: tmpl.tags,
    });
    setEditingTemplate(null);
  };

  const handleRemoveEvent = async (event: TimelineEvent) => {
    if (!confirm(`Remover "${event.description}" da linha do tempo?`)) return;
    removeEvent(event.id);
    if (event.transactionId) await onRemoveTransaction(event.transactionId);
  };

  const startListening = () => {
    const SR = getSpeechRecognition();
    if (!SR) {
      alert("Seu navegador não suporta reconhecimento de voz. Use Chrome no Android ou Safari no iPhone.");
      return;
    }

    const rec = new SR();
    rec.lang = "pt-BR";
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ");
      setTranscript(text);
      if (e.results[e.results.length - 1].isFinal) {
        const parsed = parseVoiceText(text, templates);
        setVoicePreview(parsed);
        setListening(false);
      }
    };

    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    setTranscript("");
    setVoicePreview(null);
    setListening(true);
    rec.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const confirmVoiceEvents = async () => {
    if (!voicePreview?.length) return;
    for (const ev of voicePreview) {
      await confirmEvent({
        type: ev.type,
        description: ev.description,
        amount: ev.amount,
        categoryId: ev.categoryId,
        tags: ev.tags,
      });
    }
    setVoicePreview(null);
    setTranscript("");
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(customAmount);
    if (!customDesc.trim() || !(amount > 0)) return;
    await confirmEvent({
      type: customType,
      description: customDesc.trim(),
      amount,
      categoryId: customType === "entrada" ? "renda-extra" : "outros",
    });
    setCustomDesc("");
    setCustomAmount("");
    setCustomOpen(false);
  };

  // saldo acumulado por evento
  let running = 0;
  const eventsWithBalance = events.map((ev) => {
    running += ev.type === "entrada" ? ev.amount : -ev.amount;
    return { ...ev, running };
  });

  return (
    <div className="space-y-5">
      {/* Saldo ao vivo */}
      <div
        className={`rounded-2xl p-5 border ${
          saldo >= 0
            ? "bg-gradient-to-br from-emerald-900/30 to-zinc-900/50 border-emerald-800/40"
            : "bg-gradient-to-br from-red-900/30 to-zinc-900/50 border-red-800/40"
        }`}
      >
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">
          Saldo ao vivo — este mês
        </p>
        <p
          className={`text-4xl font-bold ${saldo >= 0 ? "text-emerald-400" : "text-red-400"}`}
        >
          {saldo >= 0 ? "+" : ""}
          {brl(saldo)}
        </p>
        <div className="flex gap-4 mt-2 text-sm">
          <span className="text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> {brl(totalEntradas)}
          </span>
          <span className="text-red-400 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" /> {brl(totalSaidas)}
          </span>
        </div>
      </div>

      {/* Botão de voz */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={listening ? stopListening : startListening}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${
            listening
              ? "bg-red-600 hover:bg-red-500 text-white animate-pulse"
              : "bg-violet-600 hover:bg-violet-500 text-white"
          }`}
        >
          {listening ? (
            <>
              <MicOff className="w-6 h-6" /> Parar
            </>
          ) : (
            <>
              <Mic className="w-6 h-6" /> Falar evento
            </>
          )}
        </button>
        <p className="text-xs text-zinc-500 text-center max-w-xs">
          Ex: &quot;hoje recebi meu salário, paguei a pensão, a luz e dei 300 reais pra minha mãe&quot;
        </p>
        {listening && transcript && (
          <p className="text-sm text-zinc-300 italic text-center px-4">{transcript}…</p>
        )}
      </div>

      {/* Preview de voz */}
      {voicePreview && (
        <div className="bg-violet-900/20 border border-violet-800/40 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-violet-300 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            Entendi {voicePreview.length} evento(s):
          </div>
          {voicePreview.map((ev, i) => (
            <div
              key={i}
              className="flex justify-between items-center bg-zinc-950/60 rounded-xl px-3 py-2"
            >
              <span className="text-sm text-zinc-200">{ev.description}</span>
              <span
                className={`text-sm font-bold ${ev.type === "entrada" ? "text-emerald-400" : "text-red-400"}`}
              >
                {ev.type === "entrada" ? "+" : "−"}
                {brl(ev.amount)}
              </span>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                setVoicePreview(null);
                setTranscript("");
              }}
              className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={confirmVoiceEvents}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold"
            >
              Confirmar tudo
            </button>
          </div>
        </div>
      )}

      {/* Esteira — caixas pendentes */}
      {pendingTemplates.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">
            Esteira do mês
          </h3>
          <div className="space-y-2">
            {pendingTemplates.map((tmpl) => (
              <div key={tmpl.id}>
                {editingTemplate?.id === tmpl.id ? (
                  <div className="flex gap-2 items-center bg-zinc-900 border border-zinc-700 rounded-xl p-3">
                    <span className="text-sm text-zinc-300 flex-1 truncate">{tmpl.label}</span>
                    <input
                      type="number"
                      step="0.01"
                      autoFocus
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-24 bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1.5 text-sm text-white"
                    />
                    <button
                      onClick={() =>
                        handleTemplateConfirm(tmpl, Number(editAmount) || tmpl.amount)
                      }
                      className="p-2 bg-emerald-600 rounded-lg text-white"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingTemplate(null)}
                      className="p-2 bg-zinc-800 rounded-lg text-zinc-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleTemplateConfirm(tmpl)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setEditingTemplate(tmpl);
                      setEditAmount(String(tmpl.amount));
                    }}
                    className="w-full flex items-center gap-3 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-600 rounded-xl px-4 py-3 transition-colors text-left group"
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors ${
                        tmpl.type === "entrada"
                          ? "border-emerald-600 group-hover:bg-emerald-600/20"
                          : "border-red-600 group-hover:bg-red-600/20"
                      }`}
                    />
                    <span className="text-sm text-zinc-200 flex-1">{tmpl.label}</span>
                    <span
                      className={`text-sm font-semibold ${
                        tmpl.type === "entrada" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {tmpl.type === "entrada" ? "+" : "−"}
                      {brl(tmpl.amount)}
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-600 mt-2">
            Segure pressionado para editar o valor antes de confirmar
          </p>
        </div>
      )}

      {/* Evento manual */}
      {customOpen ? (
        <form
          onSubmit={handleCustomSubmit}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3"
        >
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCustomType("entrada")}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${
                customType === "entrada"
                  ? "bg-emerald-900/40 border-emerald-600 text-emerald-300"
                  : "border-zinc-700 text-zinc-500"
              }`}
            >
              Entrada
            </button>
            <button
              type="button"
              onClick={() => setCustomType("saida")}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border ${
                customType === "saida"
                  ? "bg-red-900/40 border-red-600 text-red-300"
                  : "border-zinc-700 text-zinc-500"
              }`}
            >
              Saída
            </button>
          </div>
          <input
            type="text"
            required
            value={customDesc}
            onChange={(e) => setCustomDesc(e.target.value)}
            placeholder="Ex: Pizza, lanche, freela..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm"
          />
          <input
            type="number"
            step="0.01"
            required
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Valor"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCustomOpen(false)}
              className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-zinc-100 text-black rounded-xl text-sm font-semibold"
            >
              Adicionar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setCustomOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-zinc-700 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
        >
          <Plus className="w-4 h-4" /> Adicionar evento extra
        </button>
      )}

      {/* Linha do tempo confirmada */}
      {eventsWithBalance.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Linha do tempo
          </h3>
          <div className="space-y-0">
            {[...eventsWithBalance].reverse().map((ev, idx) => (
              <div key={ev.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 mt-1.5 ${
                      ev.type === "entrada" ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />
                  {idx < eventsWithBalance.length - 1 && (
                    <div className="w-px flex-1 bg-zinc-800 min-h-[2rem]" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">{ev.description}</p>
                      <p className="text-[10px] text-zinc-500">
                        {format(parseISO(ev.confirmedAt), "dd/MM HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-sm font-bold ${
                          ev.type === "entrada" ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {ev.type === "entrada" ? "+" : "−"}
                        {brl(ev.amount)}
                      </span>
                      <button
                        onClick={() => handleRemoveEvent(ev)}
                        className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                        aria-label="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p
                    className={`text-xs mt-0.5 font-medium ${
                      ev.running >= 0 ? "text-emerald-500/70" : "text-red-500/70"
                    }`}
                  >
                    Saldo: {ev.running >= 0 ? "+" : ""}
                    {brl(ev.running)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && pendingTemplates.length > 0 && (
        <p className="text-center text-sm text-zinc-500 py-4">
          Toque nas caixas acima ou use o microfone para começar a linha do tempo.
        </p>
      )}
    </div>
  );
}
