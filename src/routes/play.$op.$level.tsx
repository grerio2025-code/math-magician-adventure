import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { generateQuestions, isMemoryLevel, type Mode, type Op, type Question } from "@/lib/questions";
import { addRanking, type RankOp } from "@/lib/rankings";
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

const OP_MAP: Record<string, Op> = { plus: "+", minus: "-", times: "x", divide: "/" };

function opSymbol(op: Op): string {
  if (op === "x") return "×";
  if (op === "/") return "÷";
  return op;
}

function opWordOf(op: Op): string {
  if (op === "+") return "Penjumlahan";
  if (op === "-") return "Pengurangan";
  if (op === "x") return "Perkalian";
  return "Pembagian";
}

function opGradient(op: Op): string {
  if (op === "+") return "var(--gradient-plus)";
  if (op === "-") return "var(--gradient-minus)";
  if (op === "x") return "linear-gradient(135deg, #6366f1, #a855f7)";
  return "linear-gradient(135deg, #0ea5e9, #14b8a6)";
}

function PlayRoute() {
  const { op: opParam, level } = Route.useParams();
  const navigate = useNavigate();
  const op: Op = OP_MAP[opParam] ?? "+";
  const maxLvl = op === "+" || op === "-" ? 4 : 3;
  const lvl = Math.min(maxLvl, Math.max(1, parseInt(level, 10))) as 1 | 2 | 3 | 4;
  const isMemory = isMemoryLevel(op, lvl);

  const [mode, setMode] = useState<Mode | null>(isMemory ? "choices" : null);
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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const finalRef = useRef<{ score: number; seconds: number } | null>(null);

  // memory phase
  const [showMemorize, setShowMemorize] = useState(false);
  const [memCountdown, setMemCountdown] = useState(0);

  useEffect(() => {
    if (stage !== "playing") return;
    startRef.current = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [stage]);

  const current = questions[index];

  // Trigger memory phase when a new memory question comes into view
  useEffect(() => {
    if (stage !== "playing" || !current) return;
    if (current.shown && current.hideSeconds) {
      setShowMemorize(true);
      setMemCountdown(current.hideSeconds);
    } else {
      setShowMemorize(false);
    }
  }, [stage, index, current]);

  // countdown timer for memorize phase
  useEffect(() => {
    if (!showMemorize) return;
    if (memCountdown <= 0) {
      setShowMemorize(false);
      return;
    }
    const t = setTimeout(() => setMemCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [showMemorize, memCountdown]);

  const start = () => {
    if (!mode || !name.trim() || !age.trim()) return;
    setQuestions(generateQuestions(op, lvl, mode));
    setIndex(0);
    setScore(0);
    setInput("");
    setElapsed(0);
    setSaveStatus("idle");
    finalRef.current = null;
    setStage("playing");
  };

  const persistScore = async (finalScore: number, seconds: number) => {
    setSaveStatus("saving");
    const { error } = await addRanking({
      name: name.trim(),
      age: parseInt(age, 10) || 0,
      op: op as RankOp,
      level: lvl,
      mode: mode!,
      score: finalScore,
      total: questions.length,
      seconds,
      date: Date.now(),
    });
    setSaveStatus(error ? "error" : "saved");
  };

  const submit = (val: number) => {
    if (feedback !== null || !current) return;
    const ok = val === current.answer;
    const nextScore = ok ? score + 1 : score;
    if (ok) setScore(nextScore);
    setFeedback(ok ? "correct" : "wrong");
    const isLast = index + 1 >= questions.length;
    if (isLast) {
      const seconds = Math.floor((Date.now() - startRef.current) / 1000);
      setElapsed(seconds);
      finalRef.current = { score: nextScore, seconds };
      // fire immediately so it doesn't depend on the 700ms feedback animation
      void persistScore(nextScore, seconds);
    }
    setTimeout(() => {
      setFeedback(null);
      setInput("");
      if (isLast) {
        setStage("done");
      } else {
        setIndex((i) => i + 1);
      }
    }, 700);
  };

  const resave = () => {
    const f = finalRef.current;
    if (!f) return;
    void persistScore(f.score, f.seconds);
  };

  const shareResult = async () => {
    const f = finalRef.current;
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const titleLabel =
      (op === "+" || op === "-") && lvl === 4
        ? `HC Level ${op === "+" ? 1 : 2}`
        : `${sym} Level ${lvl}`;
    const medal = f ? getMedal(lvl, f.score, f.seconds) : null;
    const medalLabel = medalInfo(medal).label;
    const scoreTxt = f ? `${f.score}/${questions.length}` : "";
    const timeTxt = f ? `${Math.floor(f.seconds / 60)}m ${f.seconds % 60}s` : "";
    const text = `🎉 ${name.trim()} main Go-Q ${titleLabel} — skor ${scoreTxt} dalam ${timeTxt}, ${medal ? `dapat medali ${medalLabel}` : "belum medali"}! Coba juga:`;
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ title: "Go-Q", text, url });
        return;
      }
    } catch {
      // ignored
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      alert("Hasil disalin ke clipboard!");
    } catch {
      alert(`${text} ${url}`);
    }
  };


  const gradient = opGradient(op);
  const opWord = opWordOf(op);
  const sym = opSymbol(op);

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
              {(op === "+" || op === "-") && lvl === 4
                ? `HC Level ${op === "+" ? 1 : 2}`
                : `${sym} Level ${lvl}`}
            </h1>
            <p className="opacity-90">
              {(op === "+" || op === "-") && lvl === 4 ? "Lomba Hitung Cepat" : opWord} — 50 soal seru
            </p>
            {isMemory && (
              <p className="opacity-90 text-sm mt-1">Mode Hafalan: lihat & ingat, lalu pilih jawabannya!</p>
            )}
          </div>

          <div className="mt-6 rounded-3xl bg-card p-6 shadow-[var(--shadow-fun)] border-2 border-border">
            {!isMemory && !mode ? (
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
                {!isMemory && (
                  <div className="text-center text-sm text-muted-foreground mb-3">
                    Mode: <b>{mode === "blind" ? "🙈 Blind" : "🎯 Choices"}</b>{" "}
                    <button onClick={() => setMode(null)} className="underline text-primary">ubah</button>
                  </div>
                )}
                {isMemory && (
                  <div className="text-center text-sm text-muted-foreground mb-3">
                    Mode: <b>🧠 Hafalan</b>
                  </div>
                )}
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
    const medal = getMedal(lvl, score, elapsed);
    const info = medalInfo(medal);
    const targets = getTargets(lvl);
    return (
      <div className="min-h-screen px-4 py-8 flex items-center">
        <div className="mx-auto w-full max-w-lg text-center animate-pop">
          <div className={`mx-auto w-32 h-32 rounded-full bg-gradient-to-br ${info.color} flex items-center justify-center text-7xl shadow-[var(--shadow-fun)] border-4 border-white`}>
            {info.emoji}
          </div>
          <h1 className="font-display text-4xl font-bold mt-4">Hebat, {name}!</h1>
          <p className="font-display text-2xl mt-1 text-foreground/80">
            {medal ? `Kamu dapat Medali ${info.label}!` : "Belum dapat medali — coba lagi ya!"}
          </p>
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

          <div className="mt-4 rounded-3xl bg-card p-4 shadow-[var(--shadow-fun)] border-2 border-border text-left text-sm">
            <div className="font-display text-center text-base mb-2">Target Medali Level {lvl}</div>
            <div className="space-y-1">
              <div className="flex justify-between"><span>🥇 Emas</span><span className="font-mono">≥{targets.gold.minScore} • ≤{formatSecs(targets.gold.maxSeconds)}</span></div>
              <div className="flex justify-between"><span>🥈 Perak</span><span className="font-mono">≥{targets.silver.minScore} • ≤{formatSecs(targets.silver.maxSeconds)}</span></div>
              <div className="flex justify-between"><span>🥉 Perunggu</span><span className="font-mono">≥{targets.bronze.minScore} • ≤{formatSecs(targets.bronze.maxSeconds)}</span></div>
            </div>
          </div>

          <div className="mt-4 text-sm min-h-[1.5rem]">
            {saveStatus === "saving" && <span className="text-muted-foreground">💾 Menyimpan skor…</span>}
            {saveStatus === "saved" && <span className="text-emerald-600 font-semibold">✅ Skor tersimpan di Ranking</span>}
            {saveStatus === "error" && (
              <span className="text-rose-600">
                ⚠ Gagal menyimpan skor.{" "}
                <button onClick={resave} className="underline font-semibold">Coba simpan ulang</button>
              </span>
            )}
          </div>



          <div className="mt-6 flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => { setStage("setup"); setMode(isMemory ? "choices" : null); }}
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

        {showMemorize && current?.shown ? (
          <>
            <div
              className="mt-6 rounded-3xl p-6 md:p-8 text-white text-center shadow-[var(--shadow-fun)] border-4 border-white/60"
              style={{ background: gradient }}
            >
              <div className="text-xs uppercase tracking-widest opacity-80">Hafalkan! ({memCountdown}s)</div>
              <div className="mt-4 grid gap-3">
                {current.shown.map((f, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-white/20 border-2 border-white/60 py-3 md:py-4 font-display text-3xl md:text-5xl font-bold drop-shadow"
                  >
                    {f.a} {opSymbol(f.op)} {f.b} = {f.answer}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => { setShowMemorize(false); setMemCountdown(0); }}
                className="btn-pop rounded-2xl bg-primary px-6 py-3 font-display text-lg text-primary-foreground shadow-md"
              >
                ⏭ Lanjut
              </button>
            </div>
          </>
        ) : (
          <>
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
              <div className="font-display text-4xl md:text-6xl font-bold mt-2 drop-shadow break-words">
                {current.display ?? `${current.a} ${opSymbol(current.op)} ${current.b}`} = ?
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
                <div className={`grid gap-3 ${current.choices!.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
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
          </>
        )}
      </div>
    </div>
  );
}
