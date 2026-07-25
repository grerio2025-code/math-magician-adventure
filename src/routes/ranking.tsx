import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getRankings, formatTime, type RankEntry, type RankOp } from "@/lib/rankings";
import { getMedal, medalInfo } from "@/lib/medals";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking — Go-Q" },
      { name: "description", content: "Papan skor Go-Q: lihat pemain terbaik dan waktu tercepat." },
      { property: "og:title", content: "Ranking — Go-Q" },
      { property: "og:description", content: "Skor tertinggi & waktu tercepat pemain Go-Q." },
    ],
  }),
  component: RankingPage,
});

type OpFilter = "all" | RankOp;
type LevelFilter = "all" | 1 | 2 | 3 | 4;

const OP_LABEL: Record<OpFilter, string> = {
  all: "Semua Operasi",
  "+": "➕ Plus",
  "-": "➖ Minus",
  x: "✖ Kali",
  "/": "➗ Bagi",
};

function opDisplay(op: RankOp): string {
  if (op === "x") return "×";
  if (op === "/") return "÷";
  return op;
}

function opColor(op: RankOp): string {
  if (op === "+") return "text-emerald-600";
  if (op === "-") return "text-orange-600";
  if (op === "x") return "text-indigo-600";
  return "text-cyan-600";
}

function RankingPage() {
  const [entries, setEntries] = useState<RankEntry[]>([]);
  const [opFilter, setOpFilter] = useState<OpFilter>("all");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");

  useEffect(() => {
    getRankings().then(setEntries);
  }, []);

  // × / ÷ only have levels 1–3
  const maxLevel = opFilter === "x" || opFilter === "/" ? 3 : 4;
  const effectiveLevel: LevelFilter =
    levelFilter !== "all" && (levelFilter as number) > maxLevel ? "all" : levelFilter;

  const filtered = useMemo(() => {
    return entries
      .filter((e) => opFilter === "all" || e.op === opFilter)
      .filter((e) => effectiveLevel === "all" || e.level === effectiveLevel)
      .sort((a, b) => b.score - a.score || a.seconds - b.seconds)
      .slice(0, 50);
  }, [entries, opFilter, effectiveLevel]);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="text-sm text-foreground/70 hover:underline">← Home</Link>
          <h1 className="font-display text-4xl font-bold">🏆 Ranking</h1>
          <div className="w-14" />
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <span>Operasi</span>
            <select
              value={opFilter}
              onChange={(e) => setOpFilter(e.target.value as OpFilter)}
              className="rounded-xl border-2 border-border bg-card px-3 py-2 font-display focus:outline-none focus:border-primary"
            >
              {(Object.keys(OP_LABEL) as OpFilter[]).map((k) => (
                <option key={k} value={k}>{OP_LABEL[k]}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <span>Level</span>
            <select
              value={String(effectiveLevel)}
              onChange={(e) => {
                const v = e.target.value;
                setLevelFilter(v === "all" ? "all" : (parseInt(v, 10) as LevelFilter));
              }}
              className="rounded-xl border-2 border-border bg-card px-3 py-2 font-display focus:outline-none focus:border-primary"
            >
              <option value="all">Semua Level</option>
              {[1, 2, 3, 4].filter((l) => l <= maxLevel).map((l) => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl bg-card p-10 text-center shadow-[var(--shadow-fun)] border-2 border-border">
            <div className="text-6xl mb-3">🎈</div>
            <p className="font-display text-xl">Belum ada skor</p>
            <p className="text-sm text-muted-foreground mt-1">Ayo main dan jadilah yang pertama!</p>
            <Link
              to="/"
              className="btn-pop mt-5 inline-block rounded-2xl bg-primary px-6 py-3 font-display text-primary-foreground shadow-md"
            >
              Mulai Main
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl bg-card shadow-[var(--shadow-fun)] border-2 border-border overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground bg-muted font-semibold">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Nama</div>
              <div className="col-span-2">Level</div>
              <div className="col-span-2">Mode</div>
              <div className="col-span-1 text-right">Skor</div>
              <div className="col-span-2 text-right">Waktu</div>
            </div>
            {filtered.map((e, i) => (
              <div
                key={`${e.date}-${i}`}
                className={`grid grid-cols-12 gap-2 px-4 py-3 items-center border-t border-border ${
                  i < 3 ? "bg-gradient-to-r from-yellow-50 to-amber-50" : ""
                }`}
              >
                <div className="col-span-1 font-display text-xl">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </div>
                <div className="col-span-4">
                  <div className="font-semibold flex items-center gap-1">
                    <span>{e.name}</span>
                    <span title={medalInfo(getMedal(e.level, e.score, e.seconds)).label}>
                      {medalInfo(getMedal(e.level, e.score, e.seconds)).emoji}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{e.age} th</div>
                </div>
                <div className="col-span-2 font-display">
                  <span className={opColor(e.op)}>
                    {opDisplay(e.op)} L{e.level}
                  </span>
                </div>
                <div className="col-span-2 text-sm">
                  {e.mode === "blind" ? "🙈 Blind" : "🎯 Choices"}
                </div>
                <div className="col-span-1 text-right font-display text-lg font-bold">
                  {e.score}<span className="text-xs text-muted-foreground">/{e.total}</span>
                </div>
                <div className="col-span-2 text-right font-mono text-sm">{formatTime(e.seconds)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
