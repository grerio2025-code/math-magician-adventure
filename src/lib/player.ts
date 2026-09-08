export interface PlayerProfile {
  name: string;
  age: number;
  school: string;
  countryCode: string;
}

const KEY_ID = "goq_player_key";
const KEY_PROFILE = "goq_player_profile";
const KEY_HOST_PREFIX = "goq_host_key_";

function randomKey() {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Stable anonymous identity for this device. */
export function getPlayerKey(): string {
  if (typeof window === "undefined") return "";
  let k = window.localStorage.getItem(KEY_ID);
  if (!k) {
    k = randomKey();
    window.localStorage.setItem(KEY_ID, k);
  }
  return k;
}

export function getProfile(): PlayerProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY_PROFILE);
    if (!raw) return null;
    const p = JSON.parse(raw) as PlayerProfile;
    if (!p?.name || !p?.age) return null;
    return { name: p.name, age: p.age, school: p.school ?? "", countryCode: p.countryCode || "ID" };
  } catch {
    return null;
  }
}

export function saveProfile(p: PlayerProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_PROFILE, JSON.stringify(p));
}

/** Host secret is kept on the creating device only. */
export function saveHostKey(code: string, hostKey: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_HOST_PREFIX + code, hostKey);
}

export function getHostKey(code: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY_HOST_PREFIX + code);
}

export function newHostKey(): string {
  return randomKey();
}
