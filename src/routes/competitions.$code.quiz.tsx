import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { getQuizState, submitQuizAnswer, type CompetitionRow, type QuizQuestionPublic } from "@/lib/competitions.functions";
import { getPlayerKey } from "@/lib/player";
import { setInCompetition } from "@/lib/ads";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/competitions/$code/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz Live — Kompetisi Go-Q" },
      { name: "description", content: "Ikuti Quiz Live Go-Q: jawab soal yang dibacakan MC secepat mungkin." },
      { property: "og:title", content: "Quiz Live — Kompetisi Go-Q" },
      { property: "og:description", content: "Jawab soal Quiz Live yang dibacakan MC." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuizPlay,
});

function QuizPlay() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const load = useServerFn(getQuizState);
  const send = useServerFn(submitQuizAnswer);
  const [comp, setComp] = useState<CompetitionRow | null>(null);
  const [q, setQ] = useState<QuizQuestionPublic | null>(null);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState<{ pos: number; correct: boolean } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [left, setLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setInCompetition(true);
    return () => setInCompetition(false);
  }, []);

  const refresh = useCallback(async () => {
    const r = await load({ data: { code, playerKey: getPlayerKey() } });
    setComp(r.competition);
    setQ((prev) => {
      if (prev?.position !== r.question?.position) {
        setInput("");
        setMsg(null);
      }
      return r.question;
    });
    setAnswered(r.answered);
    setLoading(false);
  }, [load, code]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 2500);
    const ch = supabase
      .channel(`quiz-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "competitions" }, () => refresh())
      .subscribe();
    return () => {
      window.clearInterval(id);
      supabase.removeChannel(ch);
    };
  }, [refresh, code]);

  useEffect(() => {
    if (comp?.status === "completed") {
      setInCompetition(false);
      navigate({ to: "/competitions/$code/results", params: { code: comp.join_code } });
    }
  }, [comp?.status, comp?.join_code, navigate]);

  useEffect(() => {
    if (!comp?.question_started_at || comp.status !== "live") return;
    const t = () =>
      setLeft(Math.max(0, (comp.question_seconds ?? 20) - (Date.now() - new Date(comp.question_started_at!).getTime()) / 1000));
    t();
    const id = window.setInterval(t, 250);
    return () => window.clearInterval(id);
  }, [comp]);

  const answer = async (value: string) => {
    if (!q || answered || !value.trim()) return;
    setAnswered(true);
    const r = await send({ data: { code, playerKey: getPlayerKey(), position: q.position, answer: value } });
    if (!r.ok) setMsg(r.error);
    else setResult({ pos: q.position, correct: r.correct });
  };

  const box = "mx-auto max-w-md rounded-3xl border-4 border-white/70 p-6 text-center";
  const bg = { background: "oklch(1 0 0 / 0.88)", boxShadow: "var(--shadow-fun)" };

  if (loading) return <p className="p-10 text-center font-display text-xl font-bold">Memuat quiz…</p>;
  if (!comp)
    return (
      <div className="p-10 text-center">
        <p className="font-display text-2xl font-bold">Quiz tidak ditemukan.</p>
        <Link to="/competitions" className="btn-pop mt-4 inline-block rounded-full bg-white/85 px-5 py-2.5 font-display font-bold">← Kembali</Link>
      </div>
    );

  const timeUp = left <= 0;

  return (
    <div className="min-h-screen px-4 py-8">
      <h1 className="text-center font-display text-2xl font-bold text-foreground">🎤 {comp.title}</h1>
      <div className="mt-4">
        {comp.status === "upcoming" || !q ? (
          <div className={box} style={bg}>
            <p className="font-display text-2xl font-bold">⏳ Menunggu MC memulai…</p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">Dengarkan MC ya, soal akan muncul otomatis.</p>
          </div>
        ) : (
          <div className={box} style={bg}>
            <div className="flex justify-between font-display font-bold">
              <span className="rounded-full bg-white px-3 py-1">Soal {q.position + 1}/{comp.total_questions}</span>
              <span className="rounded-full bg-white px-3 py-1">⏱️ {Math.ceil(left)}</span>
            </div>
            {q.prompt ? (
              <p className="mt-5 whitespace-pre-wrap font-display text-2xl md:text-3xl font-bold text-foreground">{q.prompt}</p>
            ) : (
              <p className="mt-5 font-display text-xl font-bold text-muted-foreground">🎧 Dengarkan soal dari MC</p>
            )}
            {answered || timeUp ? (
              <div className="mt-5">
                {result?.pos === q.position && (
                  <p className={`rounded-2xl px-4 py-3 font-display text-xl font-bold ${result.correct ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {result.correct ? "🎉 Benar! +1" : "😅 Belum tepat"}
                  </p>
                )}
                {msg && <p className="rounded-2xl bg-amber-100 px-4 py-2 font-bold text-amber-800">{msg}</p>}
                {!answered && timeUp && <p className="font-bold text-muted-foreground">⌛ Waktu habis</p>}
                <p className="mt-3 font-semibold text-muted-foreground">Menunggu soal berikutnya…</p>
              </div>
            ) : q.choices ? (
              <div className="mt-5 grid gap-2.5">
                {q.choices.map((c, i) => (
                  <button key={i} type="button" onClick={() => answer(c)} className="btn-pop rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3 font-display text-xl font-bold text-white border-4 border-white/70">
                    {String.fromCharCode(65 + i)}. {c}
                  </button>
                ))}
              </div>
            ) : (
              <form className="mt-5 grid gap-2.5" onSubmit={(e) => { e.preventDefault(); answer(input); }}>
                <input autoFocus value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tulis jawaban" className="w-full rounded-2xl border-4 border-white/70 bg-white px-4 py-3 text-center font-display text-2xl font-bold outline-none" />
                <button type="submit" className="btn-pop rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-6 py-3 font-display text-xl font-bold text-white">✅ Jawab</button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
