import { useState, useEffect, useCallback } from "react";
import { Transaction, Debt, Goal } from "@/lib/types";
import {
  INITIAL_TRANSACTIONS,
  INITIAL_DEBTS,
  INITIAL_GOALS,
  toLocalNoonISO,
  genId,
} from "@/lib/seed-data";
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

function cacheKey(uid: string, type: string) {
  return `fin_cache_${type}_${uid}`;
}

function readCache<T>(uid: string, type: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(cacheKey(uid, type));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeCache<T>(uid: string, type: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(cacheKey(uid, type), JSON.stringify(value));
  } catch {}
}

/** Lê dados do armazenamento local antigo (pré-Firebase). */
function readLegacyLocal<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function seedOrMigrate(uid: string) {
  const transQ = query(collection(db, "transactions"), where("userId", "==", uid));
  const snap = await getDocs(transQ);

  if (!snap.empty) return;

  // Tenta migrar dados locais existentes
  const legacyTrans = readLegacyLocal<Transaction[]>("fin_transactions_v1");
  const legacyDebts = readLegacyLocal<Debt[]>("fin_debts_v1");
  const legacyGoals = readLegacyLocal<Goal[]>("fin_goals_v1");

  if (legacyTrans && legacyTrans.length > 0) {
    await Promise.all([
      ...legacyTrans.map((t) =>
        setDoc(doc(db, "transactions", t.id), { ...t, userId: uid })
      ),
      ...(legacyDebts || []).map((d) =>
        setDoc(doc(db, "debts", d.id), { ...d, userId: uid })
      ),
      ...(legacyGoals || []).map((g) =>
        setDoc(doc(db, "goals", g.id), { ...g, userId: uid })
      ),
    ]);
    return;
  }

  // Seed inicial
  await Promise.all([
    ...INITIAL_TRANSACTIONS.map((t) =>
      setDoc(doc(db, "transactions", t.id), { ...t, userId: uid })
    ),
    ...INITIAL_DEBTS.map((d) =>
      setDoc(doc(db, "debts", d.id), { ...d, userId: uid })
    ),
    ...INITIAL_GOALS.map((g) =>
      setDoc(doc(db, "goals", g.id), { ...g, userId: uid })
    ),
  ]);
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (!u) {
        setTransactions([]);
        setDebts([]);
        setGoals([]);
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

    // Mostra cache imediatamente
    setTransactions(readCache<Transaction[]>(user.uid, "transactions", []));
    setDebts(readCache<Debt[]>(user.uid, "debts", []));
    setGoals(readCache<Goal[]>(user.uid, "goals", []));

    const setup = async () => {
      try {
        await seedOrMigrate(user.uid);
      } catch (err) {
        console.error("Erro ao sincronizar dados:", err);
      }

      const transQ = query(collection(db, "transactions"), where("userId", "==", user.uid));
      const debtsQ = query(collection(db, "debts"), where("userId", "==", user.uid));
      const goalsQ = query(collection(db, "goals"), where("userId", "==", user.uid));

      const unsubTrans = onSnapshot(
        transQ,
        (snapshot) => {
          if (cancelled) return;
          const data: Transaction[] = [];
          snapshot.forEach((d) => data.push(d.data() as Transaction));
          data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setTransactions(data);
          writeCache(user.uid, "transactions", data);
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
        writeCache(user.uid, "debts", data);
      });

      const unsubGoals = onSnapshot(goalsQ, (snapshot) => {
        if (cancelled) return;
        const data: Goal[] = [];
        snapshot.forEach((d) => data.push(d.data() as Goal));
        data.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
        setGoals(data);
        writeCache(user.uid, "goals", data);
      });

      return () => {
        unsubTrans();
        unsubDebts();
        unsubGoals();
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
  }, [user]);

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
        ...(newTransaction.tags && newTransaction.tags.length > 0
          ? { tags: newTransaction.tags }
          : {}),
      };
      await setDoc(doc(db, "transactions", id), clean);
    },
    [user]
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

  const generateStandardTransactions = useCallback(
    async (year: number, month: number) => {
      if (!user) return;
      const date = toLocalNoonISO(`${year}-${String(month).padStart(2, "0")}-10`);
      const standards: Transaction[] = [
        { id: genId(), type: "entrada", categoryId: "salario", description: "Salário Maicon", amount: 1500.0, date, userId: user.uid },
        { id: genId(), type: "entrada", categoryId: "renda-extra", description: "Salário Gabrielle", amount: 1500.0, date, userId: user.uid },
        { id: genId(), type: "saida", categoryId: "filhas", description: "Pensão Bia", amount: 600.0, date, userId: user.uid, tags: ["filhas"] },
        { id: genId(), type: "saida", categoryId: "moradia", description: "Cibele (Moradia)", amount: 320.0, date, userId: user.uid, tags: ["casa"] },
        { id: genId(), type: "saida", categoryId: "moradia", description: "Luz", amount: 300.0, date, userId: user.uid, tags: ["casa", "essencial"] },
        { id: genId(), type: "saida", categoryId: "telecom", description: "Internet (OSIR)", amount: 116.0, date, userId: user.uid, tags: ["casa", "assinaturas"] },
        { id: genId(), type: "saida", categoryId: "telecom", description: "Vivo", amount: 100.0, date, userId: user.uid, tags: ["assinaturas"] },
        { id: genId(), type: "saida", categoryId: "educacao", description: "Faculdade", amount: 160.0, date, userId: user.uid, tags: ["essencial"] },
      ];
      await Promise.all(standards.map((t) => setDoc(doc(db, "transactions", t.id), t)));
    },
    [user]
  );

  return {
    transactions,
    debts,
    goals,
    addTransaction,
    removeTransaction,
    updateTransaction,
    generateStandardTransactions,
    isLoaded: authReady && dataReady,
    user,
    login,
    signOut,
    loginError,
    loginLoading,
  };
}
