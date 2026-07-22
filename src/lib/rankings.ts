export interface RankEntry {
  name: string;
  age: number;
  op: "+" | "-";
  level: 1 | 2 | 3 | 4;
  mode: "blind" | "choices";
  score: number;
  total: number;
  seconds: number;
  date: number;
}

const KEY = "go-q-rankings";

export function getRankings(): RankEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RankEntry[]) : [];
  } catch {
    return [];
  }
}

export function addRanking(entry: RankEntry) {
  const all = getRankings();
  all.push(entry);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}
