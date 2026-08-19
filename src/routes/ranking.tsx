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

const AVATARS = ["👑", "🚀", "⭐", "🐱", "🎯", "🏆", "🐻", "🌈", "🍀", "🦊"];

function opDisplay(op: RankOp): string {
  if (op === "x") return "×";
  if (op === "/") return "÷";
  return op;
}

function opToken(op: RankOp): string {
  if (op === "+") return "var(--op-plus)";
  if (op === "-") return "var(--op-minus)";
  if (op === "x") return "var(--op-times)";
  return "var(--op-divide)";
}

function RankingPage() {
  const [entries, setEntries] = useState<RankEntry[]>([]);
  const [opFilter, setOpFilter] = useState<OpFilter>("all");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");

  useEffect(() => {
    getRankings().then(setEntries);
  }, []);

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

  const selectClass =
    "rounded-full border-2 border-white/80 bg-card px-4 py-2 font-display text-sm md:text-base font-bold text-primary shadow-[var(--shadow-soft)] focus:outline-none focus:border-primary";

  return (
    <div className="relative min-h-screen overflow-hidden px-3 py-6 md:px-6 md:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-6 right-2 select-none font-display text-6xl md:text-8xl font-bold opacity-10"
        style={{ color: "var(--primary)" }}
      >
        🏆 ⭐ 🥇
      </div>

      <div className="relative mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="btn-pop inline-flex items-center gap-2 rounded-full border-4 border-white/70 px-4 py-2 font-display text-sm md:text-base font-bold text-white"
            style={{ background: "var(--gradient-op-times)", boxShadow: "var(--shadow-soft)" }}
          >
            ← Home
          </Link>
          <h1 className="font-display text-4xl md:text-6xl font-bold bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 bg-clip-text text-transparent drop-shadow-sm">
            🏆 Ranking
          </h1>
          <div className="w-10 md:w-24" />
        </div>

        <div
          className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-full border-4 border-white/70 px-5 py-3"
          style={{ background: "oklch(1 0 0 / 0.75)", boxShadow: "var(--shadow-soft)" }}
        >
          <label className="flex items-center gap-2 font-display text-sm md:text-base font-bold">
            <span>🧮 Operasi:</span>
            <select
              value={opFilter}
              onChange={(e) => setOpFilter(e.target.value as OpFilter)}
              className={selectClass}
            >
              {(Object.keys(OP_LABEL) as OpFilter[]).map((k) => (
                <option key={k} value={k}>{OP_LABEL[k]}</option>
              ))}
            </select>
          </label>
          <span className="hidden sm:inline text-muted-foreground">|</span>
          <label className="flex items-center gap-2 font-display text-sm md:text-base font-bold">
            <span>📊 Level:</span>
            <select
              value={String(effectiveLevel)}
              onChange={(e) => {
                const v = e.target.value;
                setLevelFilter(v === "all" ? "all" : (parseInt(v, 10) as LevelFilter));
              }}
              className={selectClass}
            >
              <option value="all">Semua Level</option>
              {[1, 2, 3, 4].filter((l) => l <= maxLevel).map((l) => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <div
            className="mt-6 rounded-3xl border-4 border-white/70 bg-card p-10 text-center"
            style={{ boxShadow: "var(--shadow-fun)" }}
          >
            <div className="text-6xl mb-3">🎈</div>
            <p className="font-display text-xl">Belum ada skor</p>
            <p className="text-sm text-muted-foreground mt-1">Ayo main dan jadilah yang pertama!</p>
            <Link
              to="/"
              className="btn-pop mt-5 inline-block rounded-full bg-primary px-6 py-3 font-display text-primary-foreground shadow-md"
            >
              Mulai Main
            </Link>
          </div>
        ) : (
          <div
            className="mt-6 overflow-hidden rounded-[2rem] border-4 border-white/70 p-2 md:p-3"
            style={{ background: "oklch(1 0 0 / 0.8)", boxShadow: "var(--shadow-fun)" }}
          >
            <div
              className="hidden md:grid grid-cols-12 items-center gap-2 rounded-2xl px-4 py-3 font-display text-xs font-bold uppercase tracking-wider text-white"
              style={{ background: "linear-gradient(90deg, var(--op-times), var(--primary), var(--op-divide))" }}
            >
              <div className="col-span-1">#</div>
              <div className="col-span-4">👤 Nama</div>
              <div className="col-span-2 text-center">⭐ Level</div>
              <div className="col-span-2 text-center">🎮 Mode</div>
              <div className="col-span-1 text-center">🏆 Skor</div>
              <div className="col-span-2 text-center">🕐 Waktu</div>
            </div>

            <div className="grid gap-2 pt-2">
              {filtered.map((e, i) => {
                const medal = medalInfo(getMedal(e.level, e.score, e.seconds));
                const top = i < 3;
                const topBg = [
                  "linear-gradient(90deg, color-mix(in oklab, gold 30%, white 70%), color-mix(in oklab, gold 12%, white 88%))",
                  "linear-gradient(90deg, color-mix(in oklab, #b8c6db 40%, white 60%), color-mix(in oklab, #b8c6db 14%, white 86%))",
                  "linear-gradient(90deg, color-mix(in oklab, #e8a56b 35%, white 65%), color-mix(in oklab, #e8a56b 12%, white 88%))",
                ];
                return (
                  <div
                    key={`${e.date}-${i}`}
                    className="grid grid-cols-2 md:grid-cols-12 items-center gap-2 rounded-2xl border-2 border-white/80 px-3 py-2.5"
                    style={{
                      background: top ? topBg[i] : "color-mix(in oklab, var(--primary) 5%, white 95%)",
                      boxShadow: "var(--shadow-soft)",
                    }}
                  >
                    <div className="col-span-1 flex items-center gap-2">
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-base font-bold text-white"
                        style={{
                          background: top ? "var(--gradient-op-hc)" : "var(--gradient-op-times)",
                        }}
                      >
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </span>
                    </div>

                    <div className="col-span-1 md:col-span-4 flex items-center gap-2 min-w-0">
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg"
                        style={{ background: "oklch(1 0 0 / 0.9)", boxShadow: "var(--shadow-soft)" }}
                      >
                        {AVATARS[(e.name.charCodeAt(0) + i) % AVATARS.length]}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1 font-display text-base md:text-lg font-bold leading-tight">
                          <span className="truncate">{e.name}</span>
                          <span title={medal.label}>{medal.emoji}</span>
                        </span>
                        <span className="block text-xs text-muted-foreground">{e.age} th</span>
                      </span>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex md:justify-center">
                      <span
                        className="rounded-full px-3 py-1.5 font-display text-sm font-bold"
                        style={{
                          background: `color-mix(in oklab, ${opToken(e.op)} 18%, white 82%)`,
                          color: `color-mix(in oklab, ${opToken(e.op)} 75%, black 25%)`,
                        }}
                      >
                        {opDisplay(e.op)} L{e.level}
                      </span>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex md:justify-center">
                      <span
                        className="rounded-full px-3 py-1.5 font-display text-sm font-bold"
                        style={{
                          background: "color-mix(in oklab, var(--op-minus) 14%, white 86%)",
                          color: "color-mix(in oklab, var(--op-minus) 75%, black 25%)",
                        }}
                      >
                        {e.mode === "blind" ? "🙈 Blind" : "🎯 Choices"}
                      </span>
                    </div>

                    <div className="col-span-1 md:col-span-1 flex md:justify-center">
                      <span
                        className="rounded-full px-3 py-1.5 font-display text-sm font-bold"
                        style={{
                          background: "color-mix(in oklab, var(--op-plus) 16%, white 84%)",
                          color: "color-mix(in oklab, var(--op-plus) 78%, black 22%)",
                        }}
                      >
                        🏆 {e.score}
                        <span className="text-[11px] opacity-70">/{e.total}</span>
                      </span>
                    </div>

                    <div className="col-span-1 md:col-span-2 flex md:justify-center">
                      <span
                        className="rounded-full px-3 py-1.5 font-display text-sm font-bold"
                        style={{
                          background: "color-mix(in oklab, var(--op-times) 14%, white 86%)",
                          color: "color-mix(in oklab, var(--op-times) 75%, black 25%)",
                        }}
                      >
                        🕐 {formatTime(e.seconds)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
