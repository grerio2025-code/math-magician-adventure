import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { getMcState, mcAdvance, type CompetitionRow, type ParticipantRow } from "@/lib/competitions.functions";
import CompetitionLeaderboard from "@/components/CompetitionLeaderboard";
import { getMcKey, saveMcKey } from "@/lib/player";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/competitions/$code/mc")({
  validateSearch: (s: Record<string, unknown>) => ({ k: typeof s.k === "string" ? s.k : undefined }),
  head: () => ({
    meta: [
      { title: "Panel MC — Quiz Live Go-Q" },
      { name: "description", content: "Panel MC untuk memandu Quiz Live Go-Q: mulai, lanjut soal, dan selesaikan lomba." },
      { property: "og:title", content: "Panel MC — Quiz Live Go-Q" },
      { property: "og:description", content: "Pandu Quiz Live Go-Q soal demi soal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: McPanel,
});

type Q = { position: number; prompt: string; choices: string[] | null; answer: string };

function McPanel() {
  const { code } = Route.useParams();
  const { k } = Route.useSearch();
  const load = useServerFn(getMcState);
  const advance = useServerFn(mcAdvance);
  const [key, setKey] = useState<string | null>(null);
  const [comp, setComp] = useState<CompetitionRow | null>(null);
  const [qs, setQs] = useState<Q[]>([]);
  const [answered, setAnswered] = useState(0);
  const [parts, setParts] = useState<ParticipantRow[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const c = code.toUpperCase();
    const kk = k ?? getMcKey(c);
    if (k) saveMcKey(c, k);
    if (!kk) setState("denied");
    setKey(kk);
  }, [code, k]);

  const refresh = useCallback(async () => {
    if (!key) return;
    const r = await load({ data: { code, mcKey: key } });
    if (!r.ok) return setState("denied");
    setComp(r.competition);
    setQs(r.questions);
    setAnswered(r.answeredCount);
    setParts(r.participants);
    setState("ok");
  }, [key, load, code]);

  useEffect(() => {
    if (!key) return;
    refresh();
    const id = window.setInterval(refresh, 3000);
    const ch = supabase
      .channel(`mc-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "competition_participants" }, () => refresh())
      .subscribe();
    return () => {
      window.clearInterval(id);
      supabase.removeChannel(ch);
    };
  }, [key, refresh, code]);

  useEffect(() => {
    if (!comp?.question_started_at || comp.status !== "live") return;
    const t = () =>
      setLeft(Math.max(0, (comp.question_seconds ?? 20) - (Date.now() - new Date(comp.question_started_at!).getTime()) / 1000));
    t();
    const id = window.setInterval(t, 250);
    return () => window.clearInterval(id);
  }, [comp]);

  const act = async (action: "start" | "next" | "finish") => {
    if (!key) return;
    if (action === "finish" && !confirm("Selesaikan quiz sekarang?")) return;
    setBusy(true);
    await advance({ data: { code, mcKey: key, action } });
    await refresh();
    setBusy(false);
  };

  if (state === "loading") return <p className="p-10 text-center font-display text-xl font-bold">Memuat panel MC…</p>;
  if (state === "denied" || !comp)
    return (
      <div className="p-10 text-center">
        <p className="font-display text-2xl font-bold">🔒 Tautan MC tidak valid.</p>
        <Link to="/competitions" className="btn-pop mt-4 inline-block rounded-full bg-white/85 px-5 py-2.5 font-display font-bold">
          ← Kompetisi
        </Link>
      </div>
    );

  const cur = comp.current_question ?? -1;
  const q = comp.status === "live" && cur >= 0 ? qs[cur] : null;
  const isLast = cur >= qs.length - 1;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-center font-display text-3xl font-bold text-foreground">🎤 Panel MC</h1>
        <p className="text-center text-sm font-semibold text-muted-foreground">
          {comp.title} • Kode {comp.join_code} • 👥 {parts.length} peserta
        </p>

        <div className="mt-5 rounded-3xl border-4 border-white/70 p-6 text-center" style={{ background: "oklch(1 0 0 / 0.88)", boxShadow: "var(--shadow-fun)" }}>
          {comp.status === "upcoming" && (
            <>
              <p className="font-display text-2xl font-bold">Siap memulai? {qs.length} soal menunggu.</p>
              <button disabled={busy} onClick={() => act("start")} className="btn-pop mt-4 rounded-full bg-gradient-to-r from-emerald-400 to-teal-600 px-8 py-3.5 font-display text-2xl font-bold text-white disabled:opacity-60">
                ▶️ Mulai
              </button>
            </>
          )}
          {q && (
            <>
              <div className="flex justify-between font-display font-bold">
                <span className="rounded-full bg-white px-4 py-1">Soal {cur + 1}/{qs.length}</span>
                <span className="rounded-full bg-white px-4 py-1">⏱️ {Math.ceil(left)} dtk</span>
                <span className="rounded-full bg-white px-4 py-1">✋ {answered}/{parts.length} menjawab</span>
              </div>
              <p className="mt-6 whitespace-pre-wrap font-display text-3xl md:text-5xl font-bold text-foreground">{q.prompt}</p>
              {q.choices && (
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {q.choices.map((c, i) => (
                    <div key={i} className={`rounded-2xl border-4 px-4 py-3 font-display text-xl font-bold ${c === q.answer ? "border-emerald-500 bg-emerald-100" : "border-white bg-white"}`}>
                      {String.fromCharCode(65 + i)}. {c}
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-4 rounded-2xl bg-emerald-100 px-4 py-2 font-bold text-emerald-800">✅ Jawaban (khusus MC): {q.answer}</p>
              <div className="mt-5 flex gap-2">
                <button disabled={busy} onClick={() => act("next")} className="btn-pop flex-1 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 font-display text-xl font-bold text-white disabled:opacity-60">
                  {isLast ? "🏁 Soal Terakhir — Akhiri" : "⏭️ Next"}
                </button>
                <button disabled={busy} onClick={() => act("finish")} className="btn-pop rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-6 py-3 font-display text-xl font-bold text-white disabled:opacity-60">
                  ⏹️ Selesai
                </button>
              </div>
            </>
          )}
          {comp.status === "completed" && (
            <>
              <p className="font-display text-2xl font-bold">Quiz selesai! 🎉</p>
              <Link to="/competitions/$code/results" params={{ code: comp.join_code }} className="btn-pop mt-4 inline-block rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-display text-xl font-bold text-white">
                🏆 Papan Peringkat
              </Link>
            </>
          )}
        </div>

        <h2 className="mt-6 text-center font-display text-2xl font-bold">🏅 Ranking Langsung</h2>
        <div className="mt-3">
          <CompetitionLeaderboard participants={parts} />
        </div>
      </div>
    </div>
  );
}
