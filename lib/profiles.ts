export const PROFILE_IDS = ["casal", "maicon", "gabrielle", "demo"] as const;
export type ProfileId = (typeof PROFILE_IDS)[number];

export const DEFAULT_PROFILE: ProfileId = "casal";
export const ACTIVE_PROFILE_KEY = "fin_active_profile";

export interface Profile {
  id: ProfileId;
  label: string;
}

export const PROFILES: Profile[] = [
  { id: "casal", label: "Casal" },
  { id: "maicon", label: "Maicon Gois" },
  { id: "gabrielle", label: "Gabrielle" },
  { id: "demo", label: "Demonstração" },
];

export function getProfileLabel(id: ProfileId): string {
  return PROFILES.find((p) => p.id === id)?.label ?? id;
}

export function readActiveProfile(): ProfileId {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (raw && PROFILE_IDS.includes(raw as ProfileId)) return raw as ProfileId;
  } catch {}
  return DEFAULT_PROFILE;
}

export function writeActiveProfile(id: ProfileId) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  } catch {}
}

export function cycleProfile(current: ProfileId, direction: "up" | "down"): ProfileId {
  const idx = PROFILE_IDS.indexOf(current);
  const next =
    direction === "up"
      ? (idx - 1 + PROFILE_IDS.length) % PROFILE_IDS.length
      : (idx + 1) % PROFILE_IDS.length;
  return PROFILE_IDS[next];
}
