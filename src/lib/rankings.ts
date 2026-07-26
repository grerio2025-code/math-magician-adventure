import { supabase } from "@/integrations/supabase/client";

export type RankOp = "+" | "-" | "x" | "/";

export interface RankEntry {
  name: string;
  age: number;
  op: RankOp;
  level: 1 | 2 | 3 | 4;
  mode: "blind" | "choices";
  score: number;
  total: number;
  seconds: number;
  date: number;
}

export async function getRankings(): Promise<RankEntry[]> {
  const { data, error } = await supabase
    .from("rankings")
    .select("name, age, op, level, mode, score, total, seconds, created_at")
    .order("score", { ascending: false })
    .order("seconds", { ascending: true })
    .limit(200);
  if (error || !data) return [];
  return data.map((r) => ({
    name: r.name,
    age: r.age,
    op: r.op as RankOp,
    level: r.level as 1 | 2 | 3 | 4,
    mode: r.mode as "blind" | "choices",
    score: r.score,
    total: r.total,
    seconds: r.seconds,
    date: new Date(r.created_at as string).getTime(),
  }));
}

export async function addRanking(entry: RankEntry) {
  const { error } = await supabase.from("rankings").insert({
    name: entry.name,
    age: entry.age,
    op: entry.op,
    level: entry.level,
    mode: entry.mode,
    score: entry.score,
    total: entry.total,
    seconds: entry.seconds,
  });
  if (error) {
    console.warn("addRanking failed", error, entry);
  }
  return { error };
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}
