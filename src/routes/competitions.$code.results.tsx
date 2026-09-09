import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { getCompetition, type CompetitionRow, type ParticipantRow } from "@/lib/competitions.functions";
import CompetitionLeaderboard from "@/components/CompetitionLeaderboard";
import { getPlayerKey } from "@/lib/player";
import { DIFFICULTY_LABEL, OP_LABEL_ID, type CompOp } from "@/lib/competition-questions";
import { setInCompetition } from "@/lib/ads";

export const Route = createFileRoute("/competitions/$code/results")({
  head: () => ({
    meta: [
      { title: "Hasil Lomba — Kompetisi Go-Q" },
      { name: "description", content: "Papan peringkat akhir lomba berhitung Go-Q: skor, waktu, sekolah, dan negara peserta." },
      { property: "og:title", content: "Hasil Lomba — Kompetisi Go-Q" },
      { property: "og:description", content: "Lihat papan peringkat akhir lomba berhitung Go-Q." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Results,
  errorComponent: () => (
    <p className="p-8 text-center font-display text-xl font-bold">Gagal memuat hasil lomba.</p>
  ),
  notFoundComponent: () => (
    <p className="p-8 text-center font-display text-xl font-bold">Lomba tidak ditemukan.</p>
  ),
});

function Results() {
  const { code } = Route.useParams();
  const load = useServerFn(getCompetition);
  const [comp, setComp] = useState<CompetitionRow | null>(null);
  const [parts, setParts] = useState<ParticipantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerKey, setPlayerKey] = useState("");

  const refresh = useCallback(async () => {
    const res = await load({ data: { code } });
    setComp(res.competition);
    setParts(res.participants);
    setLoading(false);
  }, [load, code]);

  useEffect(() => {
    setInCompetition(false);
    setPlayerKey(getPlayerKey());
    refresh();
  }, [refresh]);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            to="/competitions"
            className="btn-pop rounded-full bg-white/85 px-4 py-2 font-display text-base font-bold text-foreground shadow-[var(--shadow-soft)] border-2 border-white"
          >
            ← Kompetisi
          </Link>
          <Link
            to="/"
            className="btn-pop rounded-full bg-white/85 px-4 py-2 font-display text-base font-bold text-foreground shadow-[var(--shadow-soft)] border-2 border-white"
          >
            🏠 Home
          </Link>
        </div>

        <h1 className="mt-4 text-center font-display text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-transparent">
          🏆 Hasil Lomba
        </h1>
        {loading && <p className="mt-4 text-center text-sm font-semibold text-muted-foreground">Memuat…</p>}
        {comp && (
          <>
            <p className="mt-2 text-center font-display text-2xl font-bold text-foreground">{comp.title}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 text-[11px] font-semibold">
              {(comp.ops as CompOp[]).map((o) => (
                <span key={o} className="rounded-full bg-white/80 px-2.5 py-1">{OP_LABEL_ID[o] ?? o}</span>
              ))}
              <span className="rounded-full bg-white/80 px-2.5 py-1">{DIFFICULTY_LABEL[comp.difficulty]}</span>
              <span className="rounded-full bg-white/80 px-2.5 py-1">{comp.input_type === "blind" ? "Blind" : "Choices"}</span>
              <span className="rounded-full bg-white/80 px-2.5 py-1">{comp.total_questions} soal</span>
              <span className="rounded-full bg-white/80 px-2.5 py-1">
                {comp.status === "completed" ? "Selesai" : "Masih berjalan"}
              </span>
            </div>
            <div className="mt-4">
              <CompetitionLeaderboard participants={parts} highlightKey={playerKey} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
