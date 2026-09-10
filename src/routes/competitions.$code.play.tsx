import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  finishParticipant,
  getCompetition,
  submitAnswer,
  type CompetitionRow,
} from "@/lib/competitions.functions";
import {
  generateCompetitionQuestions,
  type CompDifficulty,
  type CompOp,
  type CompQuestion,
} from "@/lib/competition-questions";
import { getPlayerKey } from "@/lib/player";
import { setInCompetition } from "@/lib/ads";

export const Route = createFileRoute("/competitions/$code/play")({
  head: () => ({
    meta: [
      { title: "Bermain Lomba — Kompetisi Go-Q" },
      { name: "description", content: "Jawab soal lomba berhitung Go-Q secepat mungkin dan raih skor tertinggi." },
      { property: "og:title", content: "Bermain Lomba — Kompetisi Go-Q" },
      { property: "og:description", content: "Jawab soal lomba berhitung Go-Q secepat mungkin dan raih skor tertinggi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlayCompetition,
  errorComponent: () => (
    <p className="p-8 text-center font-display text-xl font-bold">Gagal memuat lomba. Coba muat ulang.</p>
  ),
  notFoundComponent: () => (
    <p className="p-8 text-center font-display text-xl font-bold">Lomba tidak ditemukan.</p>
  ),
});

function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function PlayCompetition() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const load = useServerFn(getCompetition);
  const send = useServerFn(submitAnswer);
  const finish = useServerFn(finishParticipant);

  const [comp, setComp] = useState<CompetitionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState<"ok" | "no" | null>(null);
  const [left, setLeft] = useState(0);
  const [done, setDone] = useState(false);
  const startedRef = useRef<number>(Date.now());
  const doneRef = useRef(false);

  useEffect(() => {
    setInCompetition(true);
    return () => setInCompetition(false);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await load({ data: { code } });
      if (!alive) return;
      setComp(res.competition);
      setLoading(false);
      if (res.competition?.started_at) startedRef.current = new Date(res.competition.started_at).getTime();
    })();
    return () => {
      alive = false;
    };
  }, [load, code]);

  const questions: CompQuestion[] = useMemo(() => {
    if (!comp) return [];
    return generateCompetitionQuestions({
      ops: comp.ops as CompOp[],
      difficulty: comp.difficulty as CompDifficulty,
      custom: comp.difficulty_custom,
      inputType: comp.input_type,
      total: comp.total_questions,
      seed: Number(comp.question_seed),
    });
  }, [comp]);

  const endGame = useCallback(async () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    setInCompetition(false);
    const elapsed = Math.round((Date.now() - startedRef.current) / 1000);
    await finish({ data: { code, playerKey: getPlayerKey(), seconds: elapsed } });
  }, [finish, code]);

  useEffect(() => {
    if (!comp || comp.status !== "live") return;
    const tick = () => {
      const elapsed = (Date.now() - startedRef.current) / 1000;
      const remain = comp.duration_seconds - elapsed;
      setLeft(remain);
      if (remain <= 0) void endGame();
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [comp, endGame]);

  const answerWith = async (value: number) => {
    if (done || !comp) return;
    const elapsed = Math.round((Date.now() - startedRef.current) / 1000);
    const res = await send({
      data: { code, playerKey: getPlayerKey(), questionIndex: idx, answer: value, seconds: elapsed },
    });
    if (!res.ok) {
      await endGame();
      return;
    }
    if (res.correct) setScore((s) => s + 1);
    setFlash(res.correct ? "ok" : "no");
    window.setTimeout(() => setFlash(null), 350);
    setInput("");
    if (idx + 1 >= comp.total_questions) {
      await endGame();
    } else {
      setIdx((i) => i + 1);
    }
  };

  if (loading) {
    return <p className="p-10 text-center font-display text-xl font-bold text-muted-foreground">Memuat lomba…</p>;
  }
  if (!comp) {
    return (
      <div className="p-10 text-center">
        <p className="font-display text-2xl font-bold">Lomba dengan kode {code} tidak ditemukan.</p>
        <Link to="/competitions" className="btn-pop mt-4 inline-block rounded-full bg-white/85 px-5 py-2.5 font-display font-bold">
          ← Kembali
        </Link>
      </div>
    );
  }

  if (done || comp.status !== "live") {
    return (
      <div className="min-h-screen px-4 py-10">
        <div
          className="mx-auto max-w-md rounded-3xl border-4 border-white/70 p-6 text-center"
          style={{ background: "oklch(1 0 0 / 0.85)", boxShadow: "var(--shadow-fun)" }}
        >
          <p className="font-display text-3xl font-bold text-foreground">
            {comp.status === "upcoming" ? "Lomba belum dimulai ⏳" : "Waktu Habis! 🎉"}
          </p>
          {done && (
            <p className="mt-2 font-display text-xl font-bold text-foreground">
              Skormu: {score} / {comp.total_questions}
            </p>
          )}
          <div className="mt-5 grid gap-2.5">
            <button
              type="button"
              onClick={() => navigate({ to: "/competitions/$code/results", params: { code: comp.join_code } })}
              className="btn-pop rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-display text-xl font-bold text-white shadow-[var(--shadow-fun)] border-4 border-white/70"
            >
              🏆 Papan Peringkat
            </button>
            <Link
              to="/competitions/$code"
              params={{ code: comp.join_code }}
              className="btn-pop rounded-full bg-white/85 px-6 py-3 font-display text-lg font-bold text-foreground border-2 border-white"
            >
              ← Lobi Lomba
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[idx];

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between gap-2 font-display text-lg font-bold">
          <span className="rounded-full bg-white/85 px-4 py-1.5">⏱️ {fmt(left)}</span>
          <span className="rounded-full bg-white/85 px-4 py-1.5">
            {idx + 1}/{comp.total_questions}
          </span>
          <span className="rounded-full bg-white/85 px-4 py-1.5">⭐ {score}</span>
        </div>

        <div
          className="mt-5 rounded-3xl border-4 border-white/70 p-8 text-center transition-colors"
          style={{
            background:
              flash === "ok"
                ? "color-mix(in oklab, var(--op-plus) 25%, white 75%)"
                : flash === "no"
                  ? "color-mix(in oklab, var(--op-minus) 22%, white 78%)"
                  : "oklch(1 0 0 / 0.85)",
            boxShadow: "var(--shadow-fun)",
          }}
        >
          <p className="font-display text-4xl md:text-5xl font-bold text-foreground">{q?.display}</p>
        </div>

        {comp.input_type === "choices" ? (
          <div className="mt-5 grid gap-2.5">
            {(q?.choices ?? []).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => void answerWith(c)}
                className="btn-pop rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3.5 font-display text-2xl font-bold text-white shadow-[var(--shadow-fun)] border-4 border-white/70"
              >
                {c}
              </button>
            ))}
          </div>
        ) : (
          <form
            className="mt-5 grid gap-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (input === "" || input === "-") return;
              void answerWith(Number(input));
            }}
          >
            <input
              autoFocus
              inputMode="numeric"
              value={input}
              onChange={(e) => setInput(e.target.value.replace(/[^\d-]/g, ""))}
              placeholder="Jawaban"
              className="w-full rounded-2xl border-4 border-white/70 bg-white/90 px-4 py-3 text-center font-display text-3xl font-bold text-foreground outline-none"
            />
            <button
              type="submit"
              className="btn-pop rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-6 py-3 font-display text-xl font-bold text-white shadow-[var(--shadow-fun)] border-4 border-white/70"
            >
              ✅ Jawab
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => void endGame()}
          className="btn-pop mx-auto mt-6 block rounded-full bg-white/85 px-5 py-2 font-display text-base font-bold text-foreground border-2 border-white"
        >
          ⏹️ Selesai
        </button>
      </div>
    </div>
  );
}
