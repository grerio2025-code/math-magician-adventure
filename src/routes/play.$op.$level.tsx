import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { generateQuestions, type Mode, type Question } from "@/lib/questions";
import { addRanking } from "@/lib/rankings";
import { getMedal, medalInfo, getTargets, formatSecs } from "@/lib/medals";

export const Route = createFileRoute("/play/$op/$level")({
  head: () => ({
    meta: [
      { title: "Bermain — Go-Q" },
      { name: "description", content: "Mainkan level berhitung Go-Q dan raih skor tertinggi!" },
      { property: "og:title", content: "Bermain — Go-Q" },
      { property: "og:description", content: "Selesaikan 50 soal dan catat waktumu." },
    ],
  }),
  component: PlayRoute,
});

type Stage = "setup" | "playing" | "done";

function PlayRoute() {
  const { op, level } = Route.useParams();
  const navigate = useNavigate();
  const opSym: "+" | "-" = op === "plus" ? "+" : "-";
  const lvl = Math.min(4, Math.max(1, parseInt(level, 10))) as 1 | 2 | 3 | 4;

  const [mode, setMode] = useState<Mode | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [stage, setStage] = useState<Stage>("setup");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<null | "correct" | "wrong">(null);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (stage !== "playing") return;
    startRef.current = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [stage]);

  const start = () => {
    if (!mode || !name.trim() || !age.trim()) return;
    setQuestions(generateQuestions(opSym, lvl, mode));
    setIndex(0);
    setScore(0);
    setInput("");
    setElapsed(0);
    setStage("playing");
  };

  const current = questions[index];

  const submit = (val: number) => {
    if (feedback !== null || !current) return;
    const ok = val === current.answer;
    if (ok) setScore((s) => s + 1);
    setFeedback(ok ? "correct" : "wrong");
    setTimeout(() => {
      setFeedback(null);
      setInput("");
      if (index + 1 >= questions.length) {
        const total = questions.length;
        const seconds = Math.floor((Date.now() - startRef.current) / 1000);
        setElapsed(seconds);
        addRanking({
          name: name.trim(),
          age: parseInt(age, 10) || 0,
          op: opSym,
          level: lvl,
          mode: mode!,
          score: ok ? score + 1 : score,
          total,
          seconds,
          date: Date.now(),
        });
        setStage("done");
      } else {
        setIndex((i) => i + 1);
      }
    }, 700);
  };

  const gradient = opSym === "+" ? "var(--gradient-plus)" : "var(--gradient-minus)";
  const opWord = opSym === "+" ? "Penjumlahan" : "Pengurangan";

  const timeLabel = useMemo(() => {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${m}m ${s}s`;
  }, [elapsed]);

  // ---------- SETUP ----------
  if (stage === "setup") {
    return (
      <div className="min-h-screen px-4 py-8 flex items-center">
        <div className="mx-auto w-full max-w-lg">
          <Link to="/" className="text-sm text-foreground/70 hover:underline">← Kembali</Link>
          <div
            className="mt-3 rounded-3xl p-8 shadow-[var(--shadow-fun)] border-4 border-white/60 text-white"
            style={{ background: gradient }}
          >
            <h1 className="font-display text-4xl font-bold drop-shadow">
              {opSym} Level {lvl}
            </h1>
            <p className="opacity-90">{opWord} — 50 soal seru</p>
          </div>

          <div className="mt-6 rounded-3xl bg-card p-6 shadow-[var(--shadow-fun)] border-2 border-border">
            {!mode ? (
              <>
                <h2 className="font-display text-2xl mb-4 text-center">Pilih Mode Bermain</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMode("blind")}
                    className="btn-pop rounded-2xl p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-display text-xl shadow-md"
                  >
                    🙈 Blind
                    <div className="text-xs font-sans opacity-90 mt-1">Isi jawabanmu</div>
                  </button>
                  <button
                    onClick={() => setMode("choices")}
                    className="btn-pop rounded-2xl p-6 bg-gradient-to-br from-pink-500 to-rose-500 text-white font-display text-xl shadow-md"
                  >
                    🎯 Choices
                    <div className="text-xs font-sans opacity-90 mt-1">Pilih dari 3 jawaban</div>
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-display text-2xl mb-4 text-center">Kenalan Dulu Yuk!</h2>
                <label className="block mb-3">
                  <span className="text-sm font-semibold">Nama</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama kamu"
                    className="mt-1 w-full rounded-xl border-2 border-border bg-input px-4 py-3 focus:outline-none focus:border-primary"
                  />
                </label>
                <label className="block mb-4">
                  <span className="text-sm font-semibold">Usia</span>
                  <input
                    type="number"
                    min={3}
                    max={99}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Umur kamu"
                    className="mt-1 w-full rounded-xl border-2 border-border bg-input px-4 py-3 focus:outline-none focus:border-primary"
                  />
                </label>
                <div className="text-center text-sm text-muted-foreground mb-3">
                  Mode: <b>{mode === "blind" ? "🙈 Blind" : "🎯 Choices"}</b>{" "}
                  <button onClick={() => setMode(null)} className="underline text-primary">ubah</button>
                </div>
                <button
                  onClick={start}
                  disabled={!name.trim() || !age.trim()}
                  className="btn-pop w-full rounded-2xl py-4 font-display text-xl font-bold text-white shadow-md disabled:opacity-50"
                  style={{ background: gradient }}
                >
                  🚀 Mulai!
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------- DONE ----------
  if (stage === "done") {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen px-4 py-8 flex items-center">
        <div className="mx-auto w-full max-w-lg text-center animate-pop">
          <div className="text-7xl mb-3">🎉</div>
          <h1 className="font-display text-4xl font-bold">Hebat, {name}!</h1>
          <div className="mt-6 rounded-3xl bg-card p-6 shadow-[var(--shadow-fun)] border-2 border-border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs uppercase text-muted-foreground">Skor</div>
                <div className="font-display text-4xl font-bold text-emerald-600">{score}/{questions.length}</div>
                <div className="text-xs text-muted-foreground">{pct}% benar</div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground">Waktu</div>
                <div className="font-display text-4xl font-bold text-indigo-600">{timeLabel}</div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => { setStage("setup"); setMode(null); }}
              className="btn-pop rounded-2xl bg-primary px-6 py-3 font-display text-lg text-primary-foreground shadow-md"
            >
              Main Lagi
            </button>
            <button
              onClick={() => navigate({ to: "/ranking" })}
              className="btn-pop rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 px-6 py-3 font-display text-lg text-white shadow-md"
            >
              🏆 Ranking
            </button>
            <Link to="/" className="btn-pop rounded-2xl bg-secondary px-6 py-3 font-display text-lg text-secondary-foreground shadow-md">
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------- PLAYING ----------
  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between text-sm font-semibold">
          <Link to="/" className="text-foreground/70 hover:underline">← Keluar</Link>
          <div className="flex gap-4">
            <span>⏱ {timeLabel}</span>
            <span>⭐ {score}</span>
            <span>{index + 1}/{questions.length}</span>
          </div>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/60">
          <div
            className="h-full transition-all"
            style={{ width: `${((index) / questions.length) * 100}%`, background: gradient }}
          />
        </div>

        <div
          className="mt-6 rounded-3xl p-8 md:p-12 text-white text-center shadow-[var(--shadow-fun)] border-4 border-white/60 relative overflow-hidden"
          style={{ background: gradient }}
        >
          {feedback && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-pop">
              <div className="text-8xl">
                {feedback === "correct" ? "✅" : "❌"}
              </div>
            </div>
          )}
          <div className="text-xs uppercase tracking-widest opacity-80">Soal {index + 1}</div>
          <div className="font-display text-5xl md:text-7xl font-bold mt-2 drop-shadow">
            {current.a} {current.op} {current.b} = ?
          </div>
        </div>

        <div className="mt-6">
          {mode === "blind" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const n = parseInt(input, 10);
                if (!Number.isNaN(n)) submit(n);
              }}
              className="flex gap-3"
            >
              <input
                autoFocus
                type="number"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={feedback !== null}
                placeholder="Jawabanmu…"
                className="flex-1 rounded-2xl border-4 border-white/70 bg-white px-5 py-4 text-2xl font-display shadow-md focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={feedback !== null || input === ""}
                className="btn-pop rounded-2xl bg-primary px-6 py-4 font-display text-xl text-primary-foreground shadow-md disabled:opacity-50"
              >
                OK
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {current.choices!.map((c) => (
                <button
                  key={c}
                  disabled={feedback !== null}
                  onClick={() => submit(c)}
                  className="btn-pop rounded-2xl bg-card border-4 border-white/70 py-5 font-display text-2xl shadow-md hover:bg-accent disabled:opacity-60"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
