import { useState, useEffect, useCallback } from "react";
import { Transaction, Debt, Goal, PlannedPurchase } from "@/lib/types";
import { toLocalNoonISO, genId } from "@/lib/seed-data";
import { getProfileSeed } from "@/lib/profile-seeds";
import {
  ProfileId,
  readActiveProfile,
  writeActiveProfile,
  cycleProfile,
  getProfileLabel,
} from "@/lib/profiles";
import {
  db,
  auth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  deleteField,
} from "firebase/firestore";

function cacheKey(uid: string, profileId: string, type: string) {
  return `fin_cache_${type}_${uid}_${profileId}`;
}

function readCache<T>(uid: string, profileId: string, type: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(cacheKey(uid, profileId, type));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeCache<T>(uid: string, profileId: string, type: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(cacheKey(uid, profileId, type), JSON.stringify(value));
  } catch {}
}

function readLegacyLocal<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function legacyMigrationKey(uid: string) {
  return `fin_migrated_legacy_${uid}`;
}

/** Marca docs sem profileId como pertencentes ao perfil casal (uma vez por usuário). */
async function migrateLegacyDocs(uid: string) {
  if (typeof window !== "undefined" && localStorage.getItem(legacyMigrationKey(uid))) return;

  const collections = ["transactions", "debts", "goals", "plannedPurchases"] as const;
  let migrated = false;

  for (const col of collections) {
    const snap = await getDocs(query(collection(db, col), where("userId", "==", uid)));
    const updates: Promise<void>[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if (!data.profileId) {
        migrated = true;
        updates.push(setDoc(doc(db, col, d.id), { profileId: "casal" }, { merge: true }));
      }
    });
    await Promise.all(updates);
  }

  if (migrated && typeof window !== "undefined") {
    localStorage.setItem(legacyMigrationKey(uid), "true");
  } else if (typeof window !== "undefined") {
    localStorage.setItem(legacyMigrationKey(uid), "true");
  }
}

async function profileHasData(uid: string, profileId: ProfileId): Promise<boolean> {
  const transQ = query(
    collection(db, "transactions"),
    where("userId", "==", uid),
    where("profileId", "==", profileId)
  );
  const snap = await getDocs(transQ);
  return !snap.empty;
}

async function seedProfile(uid: string, profileId: ProfileId) {
  const seed = getProfileSeed(profileId);
  await Promise.all([
    ...seed.transactions.map((t) =>
      setDoc(doc(db, "transactions", t.id), { ...t, userId: uid, profileId })
    ),
    ...seed.debts.map((d) =>
      setDoc(doc(db, "debts", d.id), { ...d, userId: uid, profileId })
    ),
    ...seed.goals.map((g) =>
      setDoc(doc(db, "goals", g.id), { ...g, userId: uid, profileId })
    ),
    ...seed.plannedPurchases.map((p) =>
      setDoc(doc(db, "plannedPurchases", p.id), { ...p, userId: uid, profileId })
    ),
  ]);
}

async function seedOrMigrate(uid: string, profileId: ProfileId) {
  if (profileId === "casal") {
    await migrateLegacyDocs(uid);

    const hasData = await profileHasData(uid, "casal");
    if (hasData) return;

    const legacyTrans = readLegacyLocal<Transaction[]>("fin_transactions_v1");
    const legacyDebts = readLegacyLocal<Debt[]>("fin_debts_v1");
    const legacyGoals = readLegacyLocal<Goal[]>("fin_goals_v1");

    if (legacyTrans && legacyTrans.length > 0) {
      await Promise.all([
        ...legacyTrans.map((t) =>
          setDoc(doc(db, "transactions", t.id), { ...t, userId: uid, profileId: "casal" })
        ),
        ...(legacyDebts || []).map((d) =>
          setDoc(doc(db, "debts", d.id), { ...d, userId: uid, profileId: "casal" })
        ),
        ...(legacyGoals || []).map((g) =>
          setDoc(doc(db, "goals", g.id), { ...g, userId: uid, profileId: "casal" })
        ),
      ]);
      return;
    }

    await seedProfile(uid, "casal");
    return;
  }

  const hasData = await profileHasData(uid, profileId);
  if (!hasData) {
    await seedProfile(uid, profileId);
  }
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [plannedPurchases, setPlannedPurchases] = useState<PlannedPurchase[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeProfile, setActiveProfileState] = useState<ProfileId>("casal");

  useEffect(() => {
    setActiveProfileState(readActiveProfile());
  }, []);

  const setActiveProfile = useCallback((id: ProfileId) => {
    writeActiveProfile(id);
    setActiveProfileState(id);
    setDataReady(false);
  }, []);

  const cycleProfileUp = useCallback(() => {
    setActiveProfileState((current) => {
      const next = cycleProfile(current, "up");
      writeActiveProfile(next);
      setDataReady(false);
      return next;
    });
  }, []);

  const cycleProfileDown = useCallback(() => {
    setActiveProfileState((current) => {
      const next = cycleProfile(current, "down");
      writeActiveProfile(next);
      setDataReady(false);
      return next;
    });
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (!u) {
        setTransactions([]);
        setDebts([]);
        setGoals([]);
        setPlannedPurchases([]);
        setDataReady(true);
      } else {
        setDataReady(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    setTransactions(readCache<Transaction[]>(user.uid, activeProfile, "transactions", []));
    setDebts(readCache<Debt[]>(user.uid, activeProfile, "debts", []));
    setGoals(readCache<Goal[]>(user.uid, activeProfile, "goals", []));
    setPlannedPurchases(
      readCache<PlannedPurchase[]>(user.uid, activeProfile, "plannedPurchases", [])
    );

    const setup = async () => {
      try {
        await seedOrMigrate(user.uid, activeProfile);
      } catch (err) {
        console.error("Erro ao sincronizar dados:", err);
      }

      const transQ = query(
        collection(db, "transactions"),
        where("userId", "==", user.uid),
        where("profileId", "==", activeProfile)
      );
      const debtsQ = query(
        collection(db, "debts"),
        where("userId", "==", user.uid),
        where("profileId", "==", activeProfile)
      );
      const goalsQ = query(
        collection(db, "goals"),
        where("userId", "==", user.uid),
        where("profileId", "==", activeProfile)
      );
      const purchasesQ = query(
        collection(db, "plannedPurchases"),
        where("userId", "==", user.uid),
        where("profileId", "==", activeProfile)
      );

      const unsubTrans = onSnapshot(
        transQ,
        (snapshot) => {
          if (cancelled) return;
          const data: Transaction[] = [];
          snapshot.forEach((d) => data.push(d.data() as Transaction));
          data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setTransactions(data);
          writeCache(user.uid, activeProfile, "transactions", data);
          setDataReady(true);
        },
        () => setDataReady(true)
      );

      const unsubDebts = onSnapshot(debtsQ, (snapshot) => {
        if (cancelled) return;
        const data: Debt[] = [];
        snapshot.forEach((d) => data.push(d.data() as Debt));
        data.sort((a, b) => b.amount - a.amount);
        setDebts(data);
        writeCache(user.uid, activeProfile, "debts", data);
      });

      const unsubGoals = onSnapshot(goalsQ, (snapshot) => {
        if (cancelled) return;
        const data: Goal[] = [];
        snapshot.forEach((d) => data.push(d.data() as Goal));
        data.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
        setGoals(data);
        writeCache(user.uid, activeProfile, "goals", data);
      });

      const unsubPurchases = onSnapshot(purchasesQ, (snapshot) => {
        if (cancelled) return;
        const data: PlannedPurchase[] = [];
        snapshot.forEach((d) => data.push(d.data() as PlannedPurchase));
        data.sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
        setPlannedPurchases(data);
        writeCache(user.uid, activeProfile, "plannedPurchases", data);
      });

      return () => {
        unsubTrans();
        unsubDebts();
        unsubGoals();
        unsubPurchases();
      };
    };

    let cleanup: (() => void) | undefined;
    setup().then((fn) => {
      cleanup = fn;
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [user, activeProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setLoginError(null);
    setLoginLoading(true);
    setDataReady(false);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        setLoginError("E-mail ou senha incorretos.");
      } else if (code === "auth/user-not-found") {
        setLoginError("Usuário não encontrado. Verifique se o Firebase Auth está configurado.");
      } else if (code === "auth/too-many-requests") {
        setLoginError("Muitas tentativas. Aguarde alguns minutos.");
      } else if (code === "auth/operation-not-allowed") {
        setLoginError("Login por e-mail não habilitado no Firebase. Ative em Authentication → Sign-in method.");
      } else {
        setLoginError("Erro ao entrar. Tente novamente.");
      }
      setDataReady(true);
    } finally {
      setLoginLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const addTransaction = useCallback(
    async (newTransaction: Omit<Transaction, "id" | "date"> & { id?: string; date?: string }) => {
      if (!user) return;
      const id = newTransaction.id || genId();
      const clean: Transaction = {
        id,
        type: newTransaction.type,
        categoryId: newTransaction.categoryId,
        description: newTransaction.description,
        amount: newTransaction.amount,
        date: toLocalNoonISO(newTransaction.date),
        userId: user.uid,
        profileId: activeProfile,
        ...(newTransaction.tags && newTransaction.tags.length > 0
          ? { tags: newTransaction.tags }
          : {}),
      };
      await setDoc(doc(db, "transactions", id), clean);
    },
    [user, activeProfile]
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, "transactions", id));
    },
    [user]
  );

  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      if (!user) return;
      const payload: Record<string, unknown> = { ...updates };
      if (updates.date) payload.date = toLocalNoonISO(updates.date);
      if (updates.tags && updates.tags.length === 0) {
        payload.tags = deleteField();
      }
      await setDoc(doc(db, "transactions", id), payload, { merge: true });
    },
    [user]
  );

  const addDebt = useCallback(
    async (debt: Omit<Debt, "id" | "userId" | "profileId"> & { id?: string }) => {
      if (!user) return;
      const id = debt.id || genId();
      const clean: Record<string, unknown> = {
        id,
        userId: user.uid,
        profileId: activeProfile,
        creditor: debt.creditor,
        description: debt.description,
        amount: debt.amount,
        status: debt.status,
      };
      if (debt.dueDate) clean.dueDate = debt.dueDate;
      if (debt.strategy) clean.strategy = debt.strategy;
      if (typeof debt.interestRate === "number") clean.interestRate = debt.interestRate;
      if (typeof debt.minPayment === "number") clean.minPayment = debt.minPayment;
      await setDoc(doc(db, "debts", id), clean);
    },
    [user, activeProfile]
  );

  const updateDebt = useCallback(
    async (id: string, updates: Partial<Debt>) => {
      if (!user) return;
      const payload: Record<string, unknown> = {};
      const optional: (keyof Debt)[] = ["dueDate", "strategy", "interestRate", "minPayment"];
      for (const [k, v] of Object.entries(updates)) {
        if (optional.includes(k as keyof Debt) && (v === undefined || v === "" || v === null)) {
          payload[k] = deleteField();
        } else {
          payload[k] = v;
        }
      }
      await setDoc(doc(db, "debts", id), payload, { merge: true });
    },
    [user]
  );

  const removeDebt = useCallback(
    async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, "debts", id));
    },
    [user]
  );

  const addGoal = useCallback(
    async (goal: Omit<Goal, "id" | "userId" | "profileId"> & { id?: string }) => {
      if (!user) return;
      const id = goal.id || genId();
      const clean: Record<string, unknown> = {
        id,
        userId: user.uid,
        profileId: activeProfile,
        title: goal.title,
        targetAmount: goal.targetAmount,
        savedAmount: goal.savedAmount || 0,
        deadline: toLocalNoonISO(goal.deadline),
      };
      if (goal.description) clean.description = goal.description;
      await setDoc(doc(db, "goals", id), clean);
    },
    [user, activeProfile]
  );

  const updateGoal = useCallback(
    async (id: string, updates: Partial<Goal>) => {
      if (!user) return;
      const payload: Record<string, unknown> = { ...updates };
      if (updates.deadline) payload.deadline = toLocalNoonISO(updates.deadline);
      if ("description" in updates && !updates.description) {
        payload.description = deleteField();
      }
      await setDoc(doc(db, "goals", id), payload, { merge: true });
    },
    [user]
  );

  const removeGoal = useCallback(
    async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, "goals", id));
    },
    [user]
  );

  const contributeToGoal = useCallback(
    async (id: string, amount: number) => {
      if (!user) return;
      const goal = goals.find((g) => g.id === id);
      if (!goal) return;
      const newSaved = Math.max(0, (goal.savedAmount || 0) + amount);
      await setDoc(doc(db, "goals", id), { savedAmount: newSaved }, { merge: true });
    },
    [user, goals]
  );

  const addPlannedPurchase = useCallback(
    async (
      purchase: Omit<PlannedPurchase, "id" | "userId" | "profileId"> & { id?: string }
    ) => {
      if (!user) return;
      const id = purchase.id || genId();
      const clean: Record<string, unknown> = {
        id,
        userId: user.uid,
        profileId: activeProfile,
        name: purchase.name,
        estimatedAmount: purchase.estimatedAmount,
        savedAmount: purchase.savedAmount || 0,
        targetDate: toLocalNoonISO(purchase.targetDate),
      };
      if (purchase.priority) clean.priority = purchase.priority;
      if (purchase.notes) clean.notes = purchase.notes;
      await setDoc(doc(db, "plannedPurchases", id), clean);
    },
    [user, activeProfile]
  );

  const updatePlannedPurchase = useCallback(
    async (id: string, updates: Partial<PlannedPurchase>) => {
      if (!user) return;
      const payload: Record<string, unknown> = { ...updates };
      if (updates.targetDate) payload.targetDate = toLocalNoonISO(updates.targetDate);
      if ("notes" in updates && !updates.notes) payload.notes = deleteField();
      if ("priority" in updates && !updates.priority) payload.priority = deleteField();
      await setDoc(doc(db, "plannedPurchases", id), payload, { merge: true });
    },
    [user]
  );

  const removePlannedPurchase = useCallback(
    async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, "plannedPurchases", id));
    },
    [user]
  );

  const contributeToPurchase = useCallback(
    async (id: string, amount: number) => {
      if (!user) return;
      const purchase = plannedPurchases.find((p) => p.id === id);
      if (!purchase) return;
      const newSaved = Math.max(0, (purchase.savedAmount || 0) + amount);
      await setDoc(doc(db, "plannedPurchases", id), { savedAmount: newSaved }, { merge: true });
    },
    [user, plannedPurchases]
  );

  const generateStandardTransactions = useCallback(
    async (year: number, month: number) => {
      if (!user) return;
      const date = toLocalNoonISO(`${year}-${String(month).padStart(2, "0")}-10`);
      const standards: Transaction[] = [
        { id: genId(), type: "entrada", categoryId: "salario", description: "Salário Maicon", amount: 1500.0, date, userId: user.uid, profileId: activeProfile },
        { id: genId(), type: "entrada", categoryId: "renda-extra", description: "Salário Gabrielle", amount: 1500.0, date, userId: user.uid, profileId: activeProfile },
        { id: genId(), type: "saida", categoryId: "filhas", description: "Pensão Bia", amount: 600.0, date, userId: user.uid, profileId: activeProfile, tags: ["filhas"] },
        { id: genId(), type: "saida", categoryId: "moradia", description: "Cibele (Moradia)", amount: 320.0, date, userId: user.uid, profileId: activeProfile, tags: ["casa"] },
        { id: genId(), type: "saida", categoryId: "moradia", description: "Luz", amount: 300.0, date, userId: user.uid, profileId: activeProfile, tags: ["casa", "essencial"] },
        { id: genId(), type: "saida", categoryId: "telecom", description: "Internet (OSIR)", amount: 116.0, date, userId: user.uid, profileId: activeProfile, tags: ["casa", "assinaturas"] },
        { id: genId(), type: "saida", categoryId: "telecom", description: "Vivo", amount: 100.0, date, userId: user.uid, profileId: activeProfile, tags: ["assinaturas"] },
        { id: genId(), type: "saida", categoryId: "educacao", description: "Faculdade", amount: 160.0, date, userId: user.uid, profileId: activeProfile, tags: ["essencial"] },
      ];
      await Promise.all(standards.map((t) => setDoc(doc(db, "transactions", t.id), t)));
    },
    [user, activeProfile]
  );

  return {
    transactions,
    debts,
    goals,
    plannedPurchases,
    addTransaction,
    removeTransaction,
    updateTransaction,
    addDebt,
    updateDebt,
    removeDebt,
    addGoal,
    updateGoal,
    removeGoal,
    contributeToGoal,
    addPlannedPurchase,
    updatePlannedPurchase,
    removePlannedPurchase,
    contributeToPurchase,
    generateStandardTransactions,
    isLoaded: authReady && dataReady,
    user,
    login,
    signOut,
    loginError,
    loginLoading,
    activeProfile,
    activeProfileLabel: getProfileLabel(activeProfile),
    setActiveProfile,
    cycleProfileUp,
    cycleProfileDown,
  };
}
