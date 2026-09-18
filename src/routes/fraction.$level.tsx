import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FractionVisual, FractionText } from "@/components/FractionVisual";
import {
  buildQuiz,
  LEVEL_TITLES,
  MAX_LIVES,
  POINTS_PER_CORRECT,
  motivationFor,
  starsFor,
  type FractionLevel,
  type FractionQuestion,
} from "@/lib/fractions";

export const Route = createFileRoute("/fraction/$level")({
  head: () => ({
    meta: [
      { title: "Pecahan Seru — Go-Q" },
      {
        name: "description",
        content:
          "Belajar pecahan lewat gambar pizza dan cokelat: kenali pecahan, bandingkan nilai, jumlahkan, dan bermain di Lab Pecahan.",
      },
      { property: "og:title", content: "Pecahan Seru — Go-Q" },
      {
        property: "og:description",
        content: "Kuis pecahan visual dan Lab Pecahan interaktif untuk anak SD.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FractionPage,
});

function parseFraction(text: string): [number, number] {
  const [n, d] = text.split("/").map((x) => Number(x.trim()));
  return [n, d];
}

function Confetti() {
  const pieces = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((i) => (
        <span
          key={i}
          className="animate-confetti absolute top-0 h-2.5 w-2.5 rounded-sm"
          style={{
            left: `${(i * 7 + 6) % 96}%`,
            background:
              i % 3 === 0
                ? "var(--op-fraction)"
                : i % 3 === 1
                  ? "var(--op-plus)"
                  : "var(--accent)",
            animationDelay: `${(i % 5) * 60}ms`,
          }}
        />
      ))}
    </div>
  );
}

function GameHeader({
  lives,
  score,
  index,
  total,
}: {
  lives: number;
  score: number;
  index: number;
  total: number;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/"
          aria-label="Kembali ke menu utama"
          className="btn-pop grid h-11 w-11 place-items-center rounded-full border-4 border-white/70 bg-white/80 font-display text-xl font-bold text-foreground"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          ←
        </Link>
        <div className="flex items-center gap-1 text-2xl">
          {Array.from({ length: MAX_LIVES }, (_, i) => (
            <span key={i} className={i < lives ? "" : "opacity-25 grayscale"}>
              ❤️
            </span>
          ))}
        </div>
        <div
          className="rounded-full border-4 border-white/70 px-4 py-2 font-display text-lg font-bold text-white"
          style={{ background: "var(--gradient-op-fraction)" }}
        >
          {score}
        </div>
      </div>
      <div className="mt-4">
        <p className="mb-1 text-center text-xs font-semibold text-muted-foreground">
          Soal {Math.min(index + 1, total)} dari {total}
        </p>
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(index / total) * 100}%`,
              background: "var(--gradient-op-fraction)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Summary({
  score,
  correct,
  total,
  onRetry,
}: {
  score: number;
  correct: number;
  total: number;
  onRetry: () => void;
}) {
  const stars = starsFor(correct, total);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
      <div
        className="animate-pop relative w-full max-w-md overflow-hidden rounded-3xl border-4 border-white/80 bg-white p-6 text-center"
        style={{ boxShadow: "var(--shadow-fun)" }}
      >
        <Confetti />
        <h2 className="font-display text-3xl font-bold text-foreground">Hasil Kuis</h2>
        <p className="mt-4 font-display text-5xl font-bold" style={{ color: "var(--op-fraction)" }}>
          {score}
        </p>
        <p className="text-sm text-muted-foreground">
          {correct} jawaban benar dari {total} soal
        </p>
        <div className="mt-4 text-4xl">
          {[1, 2, 3].map((s) => (
            <span key={s} className={s <= stars ? "" : "opacity-25 grayscale"}>
              ⭐
            </span>
          ))}
        </div>
        <p className="mt-4 font-display text-xl font-bold text-foreground">
          {motivationFor(stars)}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRetry}
            className="btn-pop flex-1 rounded-full border-4 border-white/70 px-6 py-3 font-display text-lg font-bold text-white"
            style={{ background: "var(--gradient-op-fraction)", boxShadow: "var(--shadow-soft)" }}
          >
            🔁 Coba Lagi
          </button>
          <Link
            to="/"
            className="btn-pop flex-1 rounded-full border-4 border-white/70 bg-white px-6 py-3 font-display text-lg font-bold text-foreground"
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            🏠 Menu Utama
          </Link>
        </div>
      </div>
    </div>
  );
}

function Quiz({ level }: { level: FractionLevel }) {
  const [questions, setQuestions] = useState<FractionQuestion[] | null>(null);
  useEffect(() => {
    setQuestions(buildQuiz(level));
  }, [level]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [picked, setPicked] = useState<string | null>(null);
  const [wrongPick, setWrongPick] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!questions) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center font-display text-xl font-bold text-muted-foreground">
        Menyiapkan soal… 🍕
      </div>
    );
  }

  const q = questions[index];
  const total = questions.length;

  function retry() {
    setQuestions(buildQuiz(level));
    setIndex(0);
    setScore(0);
    setCorrectCount(0);
    setLives(MAX_LIVES);
    setPicked(null);
    setWrongPick(null);
    setDone(false);
  }

  function choose(option: string) {
    if (picked) return;
    const isRight = option === q.correctAnswer;
    setPicked(option);
    if (isRight) {
      setScore((s) => s + POINTS_PER_CORRECT);
      setCorrectCount((c) => c + 1);
      setWrongPick(null);
    } else {
      setWrongPick(option);
    }
    const nextLives = isRight ? lives : lives - 1;
    if (!isRight) setLives(nextLives);

    window.setTimeout(() => {
      setPicked(null);
      setWrongPick(null);
      if (nextLives <= 0 || index + 1 >= total) {
        setDone(true);
      } else {
        setIndex((i) => i + 1);
      }
    }, isRight ? 900 : 1500);
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4 py-6">
      <GameHeader lives={lives} score={score} index={index} total={total} />

      <section
        className="relative overflow-hidden rounded-3xl border-4 border-white/70 p-5 text-center"
        style={{
          background: "color-mix(in oklab, var(--op-fraction) 7%, white 93%)",
          boxShadow: "var(--shadow-fun)",
        }}
      >
        {picked && picked === q.correctAnswer ? <Confetti /> : null}
        <p className="mb-1 font-display text-sm font-bold uppercase tracking-wide" style={{ color: "var(--op-fraction)" }}>
          Level {q.level} — {LEVEL_TITLES[q.level as FractionLevel]}
        </p>
        <h1 className="font-display text-xl md:text-2xl font-bold text-foreground">
          {q.question}
        </h1>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-6">
          {q.level === 1 ? (
            <FractionVisual
              visualType={q.visualType}
              totalParts={q.totalParts}
              shadedParts={q.shadedParts}
            />
          ) : null}

          {q.level === 2 ? (
            <>
              <div className="flex flex-col items-center gap-2">
                <FractionVisual
                  visualType={q.visualType}
                  totalParts={q.left.totalParts}
                  shadedParts={q.left.shadedParts}
                  size={140}
                />
                <span className="text-2xl">
                  <FractionText n={q.left.shadedParts} d={q.left.totalParts} />
                </span>
              </div>
              <span className="font-display text-4xl font-bold text-muted-foreground">
                {picked ? q.correctAnswer : "…"}
              </span>
              <div className="flex flex-col items-center gap-2">
                <FractionVisual
                  visualType={q.visualType}
                  totalParts={q.right.totalParts}
                  shadedParts={q.right.shadedParts}
                  size={140}
                />
                <span className="text-2xl">
                  <FractionText n={q.right.shadedParts} d={q.right.totalParts} />
                </span>
              </div>
            </>
          ) : null}

          {q.level === 3 ? (
            picked === q.correctAnswer ? (
              <FractionVisual
                visualType="bar"
                totalParts={q.totalParts}
                shadedParts={q.shadedParts}
              />
            ) : (
              <>
                <FractionVisual
                  visualType="bar"
                  totalParts={q.first.totalParts}
                  shadedParts={q.first.shadedParts}
                  size={130}
                />
                <span className="font-display text-4xl font-bold text-foreground">+</span>
                <FractionVisual
                  visualType="bar"
                  totalParts={q.second.totalParts}
                  shadedParts={q.second.shadedParts}
                  size={130}
                />
              </>
            )
          ) : null}
        </div>

        <div
          className={
            q.level === 2
              ? "mt-6 grid grid-cols-3 gap-3"
              : "mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
          }
        >
          {q.options.map((opt) => {
            const isWrong = wrongPick === opt;
            const isRight = picked === opt && opt === q.correctAnswer;
            const [n, d] = q.level === 2 ? [0, 0] : parseFraction(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => choose(opt)}
                disabled={!!picked}
                className={`btn-pop grid place-items-center rounded-2xl border-4 bg-white px-3 py-4 font-display text-2xl font-bold text-foreground ${
                  isWrong ? "animate-shake" : ""
                }`}
                style={{
                  borderColor: isRight
                    ? "var(--success)"
                    : isWrong
                      ? "var(--destructive)"
                      : "oklch(1 0 0 / 0.8)",
                  background: isRight
                    ? "color-mix(in oklab, var(--success) 18%, white 82%)"
                    : isWrong
                      ? "color-mix(in oklab, var(--destructive) 15%, white 85%)"
                      : "white",
                  boxShadow: "var(--shadow-soft)",
                }}
              >
                {q.level === 2 ? opt : <FractionText n={n} d={d} />}
              </button>
            );
          })}
        </div>

        {picked && picked === q.correctAnswer ? (
          <p className="mt-4 font-display text-lg font-bold" style={{ color: "var(--success)" }}>
            ✅ Benar! +{POINTS_PER_CORRECT} poin
          </p>
        ) : null}
        {wrongPick ? (
          <p className="mt-4 font-display text-base font-bold" style={{ color: "var(--destructive)" }}>
            ❌ Belum tepat — {q.hint}
          </p>
        ) : null}
      </section>

      {done ? (
        <Summary score={score} correct={correctCount} total={total} onRetry={retry} />
      ) : null}
    </div>
  );
}

function Lab() {
  const [denominator, setDenominator] = useState(6);
  const [selected, setSelected] = useState<number[]>([]);

  function toggle(i: number) {
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  }

  const m = selected.filter((i) => i < denominator).length;
  const value = m / denominator;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          to="/"
          aria-label="Kembali ke menu utama"
          className="btn-pop grid h-11 w-11 place-items-center rounded-full border-4 border-white/70 bg-white/80 font-display text-xl font-bold text-foreground"
          style={{ boxShadow: "var(--shadow-soft)" }}
        >
          ←
        </Link>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          🍕 Lab Pecahan
        </h1>
        <span className="w-11" />
      </div>

      <section
        className="rounded-3xl border-4 border-white/70 p-5"
        style={{
          background: "color-mix(in oklab, var(--op-fraction) 7%, white 93%)",
          boxShadow: "var(--shadow-fun)",
        }}
      >
        <p className="text-center text-sm font-semibold text-muted-foreground">
          Tekan potongan pizza untuk memilihnya!
        </p>

        <div className="mt-5 flex flex-col items-center gap-6 md:flex-row md:justify-center">
          <FractionVisual
            visualType="pie"
            totalParts={denominator}
            shadedParts={0}
            selected={selected.filter((i) => i < denominator)}
            onSliceClick={toggle}
            size={230}
          />
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <span className="font-display text-6xl font-bold" style={{ color: "var(--op-fraction)" }}>
                <FractionText n={m} d={denominator} />
              </span>
            </div>
            <p className="mt-3 font-display text-lg font-bold text-foreground">
              {m} dari {denominator} bagian dipilih
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Desimal {value.toFixed(2)} • {Math.round(value * 100)}%
            </p>
          </div>
        </div>

        <div className="mt-6">
          <label
            htmlFor="denominator"
            className="mb-2 block text-center font-display text-base font-bold text-foreground"
          >
            Banyak Potongan (Penyebut): {denominator}
          </label>
          <input
            id="denominator"
            type="range"
            min={2}
            max={12}
            step={1}
            value={denominator}
            onChange={(e) => setDenominator(Number(e.target.value))}
            className="w-full accent-[var(--op-fraction)]"
          />
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setSelected([])}
            className="btn-pop rounded-full border-4 border-white/70 bg-white px-5 py-2.5 font-display text-base font-bold text-foreground"
            style={{ boxShadow: "var(--shadow-soft)" }}
          >
            ♻️ Reset
          </button>
          <button
            type="button"
            onClick={() => setSelected(Array.from({ length: denominator }, (_, i) => i))}
            className="btn-pop rounded-full border-4 border-white/70 px-5 py-2.5 font-display text-base font-bold text-white"
            style={{ background: "var(--gradient-op-fraction)", boxShadow: "var(--shadow-soft)" }}
          >
            🍽️ Pilih Semua
          </button>
        </div>
      </section>
    </div>
  );
}

function FractionPage() {
  const { level } = useParams({ from: "/fraction/$level" });
  if (level === "lab") return <Lab />;
  const lvl = (level === "2" ? 2 : level === "3" ? 3 : 1) as FractionLevel;
  return <Quiz key={lvl} level={lvl} />;
}
