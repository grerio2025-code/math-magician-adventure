import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getRankings, formatTime, type RankEntry } from "@/lib/rankings";
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

type Filter = "all" | "+" | "-";

function RankingPage() {
  const [entries, setEntries] = useState<RankEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    setEntries(getRankings());
  }, []);

  const filtered = entries
    .filter((e) => filter === "all" || e.op === filter)
    .sort((a, b) => b.score - a.score || a.seconds - b.seconds)
    .slice(0, 50);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="text-sm text-foreground/70 hover:underline">← Home</Link>
          <h1 className="font-display text-4xl font-bold">🏆 Ranking</h1>
          <div className="w-14" />
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {(["all", "+", "-"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn-pop rounded-full px-5 py-2 font-display font-bold text-sm border-2 ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border"
              }`}
            >
              {f === "all" ? "Semua" : f === "+" ? "➕ Plus" : "➖ Minus"}
            </button>
          ))}
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
                  <span className={e.op === "+" ? "text-emerald-600" : "text-orange-600"}>
                    {e.op} L{e.level}
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
