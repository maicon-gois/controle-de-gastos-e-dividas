import { useState, useEffect, useCallback } from "react";
import { PaymentPlan } from "@/lib/types";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { genId } from "@/lib/seed-data";

function cacheKey(uid: string) {
  return `fin_plans_cache_${uid}`;
}

function readCache(uid: string): PaymentPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(cacheKey(uid));
    return raw ? (JSON.parse(raw) as PaymentPlan[]) : [];
  } catch {
    return [];
  }
}

function writeCache(uid: string, plans: PaymentPlan[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(cacheKey(uid), JSON.stringify(plans));
  } catch {}
}

function readLegacyPlans(): PaymentPlan[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("fin_payment_plans_v1");
    return raw ? (JSON.parse(raw) as PaymentPlan[]) : null;
  } catch {
    return null;
  }
}

async function persistPlans(uid: string, plans: PaymentPlan[]) {
  writeCache(uid, plans);
  await setDoc(doc(db, "users", uid, "settings", "paymentPlans"), {
    plans,
    updatedAt: new Date().toISOString(),
  });
}

export function usePlans(userId?: string) {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [migrated, setMigrated] = useState(false);

  useEffect(() => {
    if (!userId) {
      setPlans([]);
      setLoaded(true);
      return;
    }

    setPlans(readCache(userId));

    const unsub = onSnapshot(
      doc(db, "users", userId, "settings", "paymentPlans"),
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const cloudPlans = (data.plans as PaymentPlan[]) || [];
          setPlans(cloudPlans);
          writeCache(userId, cloudPlans);
        } else if (!migrated) {
          // Migra planos locais na primeira vez
          const legacy = readLegacyPlans();
          if (legacy && legacy.length > 0) {
            await persistPlans(userId, legacy);
          }
          setMigrated(true);
        }
        setLoaded(true);
      },
      () => setLoaded(true)
    );

    return () => unsub();
  }, [userId, migrated]);

  const addPlan = useCallback(
    (plan: Omit<PaymentPlan, "id">) => {
      if (!userId) return;
      setPlans((prev) => {
        const next = [...prev, { ...plan, id: genId() }];
        persistPlans(userId, next).catch(console.error);
        return next;
      });
    },
    [userId]
  );

  const updatePlan = useCallback(
    (id: string, updates: Partial<PaymentPlan>) => {
      if (!userId) return;
      setPlans((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
        persistPlans(userId, next).catch(console.error);
        return next;
      });
    },
    [userId]
  );

  const removePlan = useCallback(
    (id: string) => {
      if (!userId) return;
      setPlans((prev) => {
        const next = prev.filter((p) => p.id !== id);
        persistPlans(userId, next).catch(console.error);
        return next;
      });
    },
    [userId]
  );

  return { plans, loaded, addPlan, updatePlan, removePlan };
}
