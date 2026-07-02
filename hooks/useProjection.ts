import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Debt, MonthDecision, ProjectionAssumptions } from "@/lib/types";
import { computeProjection } from "@/lib/projection";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

export const DEFAULT_ASSUMPTIONS: ProjectionAssumptions = {
  incomes: [
    { id: "inc-maicon", description: "Salário Maicon", amount: 1500 },
    { id: "inc-gabrielle", description: "Salário Gabrielle", amount: 1500 },
  ],
  recurring: [
    { id: "rec-pensao", description: "Pensão Bia", amount: 600, categoryId: "filhas" },
    { id: "rec-cibele", description: "Cibele (Moradia)", amount: 320, categoryId: "moradia" },
    { id: "rec-luz", description: "Luz", amount: 300, categoryId: "moradia" },
    { id: "rec-internet", description: "Internet (OSIR)", amount: 116, categoryId: "telecom" },
    { id: "rec-vivo", description: "Vivo", amount: 100, categoryId: "telecom" },
    { id: "rec-faculdade", description: "Faculdade", amount: 160, categoryId: "educacao" },
    { id: "rec-cursor", description: "Cursor", amount: 105, categoryId: "ferramentas" },
  ],
  startYear: 2026,
  startMonth: 8,
  horizonMonths: 12,
  startingSaved: 0,
  priorityStrategy: "menor",
};

function cacheKey(uid: string) {
  return `fin_projection_${uid}`;
}

function readCache(uid: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(uid));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(uid: string, data: { assumptions: ProjectionAssumptions; decisions: Record<string, MonthDecision> }) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(cacheKey(uid), JSON.stringify(data));
  } catch {}
}

async function persistToCloud(
  uid: string,
  assumptions: ProjectionAssumptions,
  decisions: Record<string, MonthDecision>
) {
  await setDoc(doc(db, "users", uid, "settings", "projection"), {
    assumptions,
    decisions,
    updatedAt: new Date().toISOString(),
  });
}

export function useProjection(debts: Debt[], userId?: string) {
  const [assumptions, setAssumptions] = useState<ProjectionAssumptions>(DEFAULT_ASSUMPTIONS);
  const [decisions, setDecisions] = useState<Record<string, MonthDecision>>({});
  const [loaded, setLoaded] = useState(false);
  const skipNextSave = useRef(false);

  useEffect(() => {
    if (!userId) {
      setAssumptions(DEFAULT_ASSUMPTIONS);
      setDecisions({});
      setLoaded(true);
      return;
    }

    const cached = readCache(userId);
    if (cached) {
      setAssumptions(cached.assumptions || DEFAULT_ASSUMPTIONS);
      setDecisions(cached.decisions || {});
    }

    const unsub = onSnapshot(
      doc(db, "users", userId, "settings", "projection"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          skipNextSave.current = true;
          if (data.assumptions) setAssumptions(data.assumptions as ProjectionAssumptions);
          if (data.decisions) setDecisions(data.decisions as Record<string, MonthDecision>);
          writeCache(userId, {
            assumptions: (data.assumptions as ProjectionAssumptions) || DEFAULT_ASSUMPTIONS,
            decisions: (data.decisions as Record<string, MonthDecision>) || {},
          });
        }
        setLoaded(true);
      },
      () => setLoaded(true)
    );

    return () => unsub();
  }, [userId]);

  const save = useCallback(
    (nextAssumptions: ProjectionAssumptions, nextDecisions: Record<string, MonthDecision>) => {
      if (!userId) return;
      writeCache(userId, { assumptions: nextAssumptions, decisions: nextDecisions });
      persistToCloud(userId, nextAssumptions, nextDecisions).catch(console.error);
    },
    [userId]
  );

  const updateAssumptions = useCallback(
    (updates: Partial<ProjectionAssumptions>) => {
      setAssumptions((prev) => {
        const next = { ...prev, ...updates };
        setDecisions((d) => {
          save(next, d);
          return d;
        });
        return next;
      });
    },
    [save]
  );

  const addRecurring = useCallback(() => {
    setAssumptions((prev) => {
      const next = {
        ...prev,
        recurring: [
          ...prev.recurring,
          { id: genId(), description: "Nova despesa", amount: 0, categoryId: "outros" },
        ],
      };
      setDecisions((d) => {
        save(next, d);
        return d;
      });
      return next;
    });
  }, [save]);

  const updateRecurring = useCallback(
    (id: string, updates: Partial<{ description: string; amount: number }>) => {
      setAssumptions((prev) => {
        const next = {
          ...prev,
          recurring: prev.recurring.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        };
        setDecisions((d) => {
          save(next, d);
          return d;
        });
        return next;
      });
    },
    [save]
  );

  const removeRecurring = useCallback(
    (id: string) => {
      setAssumptions((prev) => {
        const next = { ...prev, recurring: prev.recurring.filter((r) => r.id !== id) };
        setDecisions((d) => {
          save(next, d);
          return d;
        });
        return next;
      });
    },
    [save]
  );

  const updateIncome = useCallback(
    (id: string, updates: Partial<{ description: string; amount: number }>) => {
      setAssumptions((prev) => {
        const next = {
          ...prev,
          incomes: prev.incomes.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        };
        setDecisions((d) => {
          save(next, d);
          return d;
        });
        return next;
      });
    },
    [save]
  );

  const setDecision = useCallback(
    (decision: MonthDecision) => {
      setDecisions((prev) => {
        const next = { ...prev, [decision.monthKey]: decision };
        setAssumptions((a) => {
          save(a, next);
          return a;
        });
        return next;
      });
    },
    [save]
  );

  const clearDecision = useCallback(
    (monthKey: string) => {
      setDecisions((prev) => {
        const next = { ...prev };
        delete next[monthKey];
        setAssumptions((a) => {
          save(a, next);
          return a;
        });
        return next;
      });
    },
    [save]
  );

  const resetPlan = useCallback(() => {
    const next: Record<string, MonthDecision> = {};
    setDecisions(next);
    setAssumptions((a) => {
      save(a, next);
      return a;
    });
  }, [save]);

  const projection = useMemo(
    () => computeProjection(debts, assumptions, decisions),
    [debts, assumptions, decisions]
  );

  return {
    assumptions,
    decisions,
    projection,
    loaded,
    updateAssumptions,
    addRecurring,
    updateRecurring,
    removeRecurring,
    updateIncome,
    setDecision,
    clearDecision,
    resetPlan,
  };
}
