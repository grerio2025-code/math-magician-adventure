export type Medal = "gold" | "silver" | "bronze" | null;

interface Tier {
  minScore: number;
  maxSeconds: number;
}

const TABLE: Record<1 | 2 | 3 | 4, { gold: Tier; silver: Tier; bronze: Tier }> = {
  1: {
    gold: { minScore: 48, maxSeconds: 90 },
    silver: { minScore: 45, maxSeconds: 120 },
    bronze: { minScore: 40, maxSeconds: 180 },
  },
  2: {
    gold: { minScore: 47, maxSeconds: 120 },
    silver: { minScore: 44, maxSeconds: 165 },
    bronze: { minScore: 38, maxSeconds: 240 },
  },
  3: {
    gold: { minScore: 46, maxSeconds: 180 },
    silver: { minScore: 42, maxSeconds: 240 },
    bronze: { minScore: 36, maxSeconds: 300 },
  },
  4: {
    gold: { minScore: 45, maxSeconds: 240 },
    silver: { minScore: 40, maxSeconds: 300 },
    bronze: { minScore: 35, maxSeconds: 360 },
  },
};

export function getMedal(
  level: 1 | 2 | 3 | 4,
  score: number,
  seconds: number,
): Medal {
  const t = TABLE[level];
  if (score >= t.gold.minScore && seconds <= t.gold.maxSeconds) return "gold";
  if (score >= t.silver.minScore && seconds <= t.silver.maxSeconds) return "silver";
  if (score >= t.bronze.minScore && seconds <= t.bronze.maxSeconds) return "bronze";
  return null;
}

export function medalInfo(m: Medal) {
  if (m === "gold") return { emoji: "🥇", label: "Emas", color: "from-yellow-400 to-amber-500" };
  if (m === "silver") return { emoji: "🥈", label: "Perak", color: "from-slate-300 to-slate-500" };
  if (m === "bronze") return { emoji: "🥉", label: "Perunggu", color: "from-orange-400 to-amber-700" };
  return { emoji: "🎈", label: "Belum medali", color: "from-slate-200 to-slate-400" };
}

export function getTargets(level: 1 | 2 | 3 | 4) {
  return TABLE[level];
}

export function formatSecs(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return ss === 0 ? `${m}m` : `${m}m ${ss}s`;
}
