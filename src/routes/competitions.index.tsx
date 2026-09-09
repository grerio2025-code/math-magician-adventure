import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { listCompetitions, type CompetitionRow } from "@/lib/competitions.functions";
import { DIFFICULTY_LABEL, OP_LABEL_ID, type CompOp } from "@/lib/competition-questions";

export const Route = createFileRoute("/competitions/")({
  head: () => ({
    meta: [
      { title: "Kompetisi Go-Q — Lomba Berhitung Serentak" },
      { name: "description", content: "Ikut lomba berhitung Go-Q bersama teman: papan peringkat langsung, PIN lomba, dan riwayat hasil tersimpan." },
      { property: "og:title", content: "Kompetisi Go-Q — Lomba Berhitung Serentak" },
      { property: "og:description", content: "Buat atau ikuti lomba berhitung Go-Q dengan papan peringkat langsung." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompetitionsPage,
});

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function StatusPill({ status }: { status: CompetitionRow["status"] }) {
  const map = {
    upcoming: { label: "Akan dimulai", bg: "linear-gradient(90deg,#fbbf24,#f59e0b)" },
    live: { label: "Sedang berjalan", bg: "linear-gradient(90deg,#34d399,#10b981)" },
    completed: { label: "Selesai", bg: "linear-gradient(90deg,#94a3b8,#64748b)" },
  } as const;
  const m = map[status];
  return (
    <span className="rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ background: m.bg }}>
      {m.label}
    </span>
  );
}

async function shareCompetition(c: CompetitionRow) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/competitions/${c.join_code}` : "";
  const data = {
    title: `Lomba Go-Q: ${c.title}`,
    text: `Yuk ikut lomba berhitung "${c.title}" di Go-Q! Kode lomba: ${c.join_code}`,
    url,
  };
  if (typeof navigator !== "undefined" && typeof (navigator as any).share === "function") {
    try {
      await (navigator as any).share(data);
    } catch {
      /* dibatalkan */
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    alert("Tautan lomba disalin!");
  } catch {
    alert(url);
  }
}

function CompetitionCard({ c, count }: { c: CompetitionRow; count: number }) {
  return (
    <div
      className="rounded-3xl border-4 border-white/70 p-4"
      style={{ background: "oklch(1 0 0 / 0.8)", boxShadow: "var(--shadow-fun)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold text-foreground">{c.title}</h2>
        <StatusPill status={c.status} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        ⏰ {fmtDate(c.start_at)} • 👥 {count} peserta • 🔑 Kode {c.join_code} {c.has_pin ? "• 🔒 PIN" : ""}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
        {(c.ops as CompOp[]).map((o) => (
          <span key={o} className="rounded-full bg-white/80 px-2.5 py-1">
            {OP_LABEL_ID[o] ?? o}
          </span>
        ))}
        <span className="rounded-full bg-white/80 px-2.5 py-1">{DIFFICULTY_LABEL[c.difficulty]}</span>
        <span className="rounded-full bg-white/80 px-2.5 py-1">
          {c.input_type === "blind" ? "Blind" : "Choices"}
        </span>
        <span className="rounded-full bg-white/80 px-2.5 py-1">{c.total_questions} soal</span>
        <span className="rounded-full bg-white/80 px-2.5 py-1">{Math.round(c.duration_seconds / 60)} menit</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to={c.status === "completed" ? "/competitions/$code/results" : "/competitions/$code"}
          params={{ code: c.join_code }}
          className="btn-pop rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-2 font-display text-base font-bold text-white shadow-[var(--shadow-soft)]"
        >
          {c.status === "completed" ? "🏆 Lihat Hasil" : "🚪 Masuk Lomba"}
        </Link>
        <button
          type="button"
          onClick={() => shareCompetition(c)}
          className="btn-pop rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2 font-display text-base font-bold text-white shadow-[var(--shadow-soft)]"
        >
          📤 Bagikan
        </button>
      </div>
    </div>
  );
}

function CompetitionsPage() {
  const load = useServerFn(listCompetitions);
  const [tab, setTab] = useState<"active" | "done">("active");
  const [rows, setRows] = useState<CompetitionRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const res = await load();
      if (!alive) return;
      setRows(res.competitions);
      setCounts(res.counts);
      setLoading(false);
    };
    run();
    const id = window.setInterval(run, 10000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [load]);

  const active = rows.filter((r) => r.status !== "completed");
  const done = rows.filter((r) => r.status === "completed");
  const shown = tab === "active" ? active : done;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link
            to="/"
            className="btn-pop rounded-full bg-white/85 px-4 py-2 font-display text-base font-bold text-foreground shadow-[var(--shadow-soft)] border-2 border-white"
          >
            🏠 Home
          </Link>
          <Link
            to="/competitions/new"
            className="btn-pop rounded-full bg-gradient-to-r from-emerald-400 to-teal-600 px-5 py-2.5 font-display text-base font-bold text-white shadow-[var(--shadow-fun)] border-2 border-white/70"
          >
            ➕ Buat Kompetisi Baru
          </Link>
        </div>

        <h1 className="text-center font-display text-4xl md:text-5xl font-bold bg-gradient-to-r from-fuchsia-500 via-orange-400 to-emerald-500 bg-clip-text text-transparent">
          🏁 Kompetisi
        </h1>
        <p className="mt-1 text-center text-sm font-semibold text-muted-foreground">
          Lomba berhitung serentak — papan peringkat langsung!
        </p>

        <form
          className="mx-auto mt-4 flex max-w-md gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const c = code.trim().toUpperCase();
            if (c) window.location.href = `/competitions/${c}`;
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Punya kode lomba? Tulis di sini"
            className="min-w-0 flex-1 rounded-full border-4 border-white/70 bg-white/85 px-4 py-2.5 font-semibold outline-none"
          />
          <button
            type="submit"
            className="btn-pop rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 font-display font-bold text-white"
          >
            Cari
          </button>
        </form>

        <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-2 rounded-full border-4 border-white/70 bg-white/70 p-1.5">
          {(
            [
              ["active", `Kompetisi Aktif (${active.length})`],
              ["done", `Kompetisi Selesai (${done.length})`],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className="rounded-full px-3 py-2 font-display text-sm font-bold transition-colors"
              style={
                tab === k
                  ? { background: "var(--gradient-op-plus)", color: "white" }
                  : { color: "var(--muted-foreground)" }
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3">
          {loading && (
            <p className="text-center text-sm font-semibold text-muted-foreground">Memuat kompetisi…</p>
          )}
          {!loading && !shown.length && (
            <p className="rounded-2xl border-4 border-white/70 bg-white/70 px-4 py-8 text-center text-sm font-semibold text-muted-foreground">
              {tab === "active" ? "Belum ada lomba aktif. Buat yang pertama! 🎉" : "Belum ada riwayat lomba."}
            </p>
          )}
          {shown.map((c) => (
            <CompetitionCard key={c.id} c={c} count={counts[c.id] ?? 0} />
          ))}
        </div>
      </div>
    </div>
  );
}
