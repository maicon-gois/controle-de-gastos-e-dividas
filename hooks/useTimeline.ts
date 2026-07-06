import { useState, useEffect, useCallback } from "react";
import { TransactionType } from "@/lib/types";
import { ProfileId } from "@/lib/profiles";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { genId } from "@/lib/seed-data";

export interface TimelineEvent {
  id: string;
  templateId?: string;
  type: TransactionType;
  description: string;
  amount: number;
  categoryId: string;
  confirmedAt: string;
  transactionId?: string;
  tags?: string[];
}

function docId(profileId: ProfileId, year: number, month: number) {
  return `timeline_${profileId}_${year}_${String(month).padStart(2, "0")}`;
}

function cacheKey(uid: string, profileId: ProfileId, year: number, month: number) {
  return `fin_timeline_${uid}_${profileId}_${year}_${month}`;
}

function readCache(uid: string, profileId: ProfileId, year: number, month: number): TimelineEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(cacheKey(uid, profileId, year, month));
    return raw ? (JSON.parse(raw) as TimelineEvent[]) : [];
  } catch {
    return [];
  }
}

function writeCache(uid: string, profileId: ProfileId, year: number, month: number, events: TimelineEvent[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(cacheKey(uid, profileId, year, month), JSON.stringify(events));
  } catch {}
}

async function persist(
  uid: string,
  profileId: ProfileId,
  year: number,
  month: number,
  events: TimelineEvent[]
) {
  writeCache(uid, profileId, year, month, events);
  await setDoc(doc(db, "users", uid, "settings", docId(profileId, year, month)), {
    events,
    profileId,
    year,
    month,
    updatedAt: new Date().toISOString(),
  });
}

export function useTimeline(
  userId?: string,
  profileId: ProfileId = "casal",
  year: number = 2026,
  month: number = 7
) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) {
      setEvents([]);
      setLoaded(true);
      return;
    }

    setEvents(readCache(userId, profileId, year, month));
    setLoaded(false);

    const ref = doc(db, "users", userId, "settings", docId(profileId, year, month));
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const cloud = (data.events as TimelineEvent[]) || [];
          setEvents(cloud);
          writeCache(userId, profileId, year, month, cloud);
        }
        setLoaded(true);
      },
      () => setLoaded(true)
    );

    return () => unsub();
  }, [userId, profileId, year, month]);

  const addEvent = useCallback(
    (event: Omit<TimelineEvent, "id" | "confirmedAt"> & { id?: string; confirmedAt?: string }) => {
      if (!userId) return null;
      const newEvent: TimelineEvent = {
        id: event.id || genId(),
        templateId: event.templateId,
        type: event.type,
        description: event.description,
        amount: event.amount,
        categoryId: event.categoryId,
        confirmedAt: event.confirmedAt || new Date().toISOString(),
        transactionId: event.transactionId,
        tags: event.tags,
      };
      setEvents((prev) => {
        const next = [...prev, newEvent].sort(
          (a, b) => new Date(a.confirmedAt).getTime() - new Date(b.confirmedAt).getTime()
        );
        persist(userId, profileId, year, month, next).catch(console.error);
        return next;
      });
      return newEvent;
    },
    [userId, profileId, year, month]
  );

  const removeEvent = useCallback(
    (id: string) => {
      if (!userId) return null;
      let removed: TimelineEvent | undefined;
      setEvents((prev) => {
        removed = prev.find((e) => e.id === id);
        const next = prev.filter((e) => e.id !== id);
        persist(userId, profileId, year, month, next).catch(console.error);
        return next;
      });
      return removed;
    },
    [userId, profileId, year, month]
  );

  const confirmedTemplateIds = events.filter((e) => e.templateId).map((e) => e.templateId!);

  return { events, loaded, addEvent, removeEvent, confirmedTemplateIds };
}
