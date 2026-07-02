import { useState, useEffect, useCallback } from "react";
import { PaymentPlan } from "@/lib/types";
import { ProfileId } from "@/lib/profiles";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import { genId } from "@/lib/seed-data";

function plansDocId(profileId: ProfileId) {
  return `paymentPlans_${profileId}`;
}

function cacheKey(uid: string, profileId: ProfileId) {
  return `fin_plans_cache_${uid}_${profileId}`;
}

function readCache(uid: string, profileId: ProfileId): PaymentPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(cacheKey(uid, profileId));
    return raw ? (JSON.parse(raw) as PaymentPlan[]) : [];
  } catch {
    return [];
  }
}

function writeCache(uid: string, profileId: ProfileId, plans: PaymentPlan[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(cacheKey(uid, profileId), JSON.stringify(plans));
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

function legacyPlansMigratedKey(uid: string) {
  return `fin_plans_migrated_${uid}`;
}

async function persistPlans(uid: string, profileId: ProfileId, plans: PaymentPlan[]) {
  writeCache(uid, profileId, plans);
  await setDoc(doc(db, "users", uid, "settings", plansDocId(profileId)), {
    plans,
    profileId,
    updatedAt: new Date().toISOString(),
  });
}

export function usePlans(userId?: string, profileId: ProfileId = "casal") {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [migrated, setMigrated] = useState(false);

  useEffect(() => {
    if (!userId) {
      setPlans([]);
      setLoaded(true);
      return;
    }

    setPlans(readCache(userId, profileId));
    setLoaded(false);

    const docRef = doc(db, "users", userId, "settings", plansDocId(profileId));

    const unsub = onSnapshot(
      docRef,
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const cloudPlans = (data.plans as PaymentPlan[]) || [];
          setPlans(cloudPlans);
          writeCache(userId, profileId, cloudPlans);
        } else if (profileId === "casal" && !migrated) {
          const legacyMigrated =
            typeof window !== "undefined" &&
            localStorage.getItem(legacyPlansMigratedKey(userId));

          if (!legacyMigrated) {
            const legacyDocRef = doc(db, "users", userId, "settings", "paymentPlans");
            const legacySnap = await getDoc(legacyDocRef);
            let legacyPlans: PaymentPlan[] | null = null;

            if (legacySnap.exists()) {
              legacyPlans = (legacySnap.data().plans as PaymentPlan[]) || [];
            } else {
              legacyPlans = readLegacyPlans();
            }

            if (legacyPlans && legacyPlans.length > 0) {
              await persistPlans(userId, "casal", legacyPlans);
            }
            if (typeof window !== "undefined") {
              localStorage.setItem(legacyPlansMigratedKey(userId), "true");
            }
          }
          setMigrated(true);
        }
        setLoaded(true);
      },
      () => setLoaded(true)
    );

    return () => unsub();
  }, [userId, profileId, migrated]);

  const addPlan = useCallback(
    (plan: Omit<PaymentPlan, "id">) => {
      if (!userId) return;
      setPlans((prev) => {
        const next = [...prev, { ...plan, id: genId() }];
        persistPlans(userId, profileId, next).catch(console.error);
        return next;
      });
    },
    [userId, profileId]
  );

  const updatePlan = useCallback(
    (id: string, updates: Partial<PaymentPlan>) => {
      if (!userId) return;
      setPlans((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
        persistPlans(userId, profileId, next).catch(console.error);
        return next;
      });
    },
    [userId, profileId]
  );

  const removePlan = useCallback(
    (id: string) => {
      if (!userId) return;
      setPlans((prev) => {
        const next = prev.filter((p) => p.id !== id);
        persistPlans(userId, profileId, next).catch(console.error);
        return next;
      });
    },
    [userId, profileId]
  );

  return { plans, loaded, addPlan, updatePlan, removePlan };
}
