import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import {
  getCompetition,
  joinCompetition,
  startCompetition,
  stopCompetition,
  type CompetitionRow,
  type ParticipantRow,
} from "@/lib/competitions.functions";
import CompetitionLeaderboard from "@/components/CompetitionLeaderboard";
import { COUNTRIES } from "@/lib/countries";
import { getHostKey, getPlayerKey, getProfile, saveProfile } from "@/lib/player";
import { supabase } from "@/integrations/supabase/client";
import { DIFFICULTY_LABEL, OP_LABEL_ID, type CompOp } from "@/lib/competition-questions";

export const Route = createFileRoute("/competitions/$code/")({
  head: () => ({
    meta: [
      { title: "Lobi Lomba — Kompetisi Go-Q" },
      { name: "description", content: "Gabung lomba berhitung Go-Q, lihat peserta, dan pantau papan peringkat langsung." },
      { property: "og:title", content: "Lobi Lomba — Kompetisi Go-Q" },
      { property: "og:description", content: "Gabung lomba berhitung Go-Q dan pantau papan peringkat langsung." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Lobby,
  errorComponent: () => (
    <p className="p-8 text-center font-display text-xl font-bold">Gagal memuat lomba. Coba muat ulang.</p>
  ),
  notFoundComponent: () => (
    <p className="p-8 text-center font-display text-xl font-bold">Lomba tidak ditemukan.</p>
  ),
});

const field =
  "w-full rounded-2xl border-4 border-white/70 bg-white/90 px-4 py-2.5 font-semibold text-foreground outline-none";

function Lobby() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const load = useServerFn(getCompetition);
  const join = useServerFn(joinCompetition);
  const start = useServerFn(startCompetition);
  const stop = useServerFn(stopCompetition);

  const [comp, setComp] = useState<CompetitionRow | null>(null);
  const [parts, setParts] = useState<ParticipantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerKey, setPlayerKey] = useState("");
  const [hostKey, setHostKey] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [school, setSchool] = useState("");
  const [country, setCountry] = useState("ID");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await load({ data: { code } });
    setComp(res.competition);
    setParts(res.participants);
    setLoading(false);
  }, [load, code]);

  useEffect(() => {
    setPlayerKey(getPlayerKey());
    setHostKey(getHostKey(code.toUpperCase()));
    const p = getProfile();
    if (p) {
      setName(p.name);
      setAge(String(p.age));
      setSchool(p.school);
      setCountry(p.countryCode);
    }
  }, [code]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 5000);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    const channel = supabase
      .channel(`comp-${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "competition_participants" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "competitions" }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [code, refresh]);

  const me = parts.find((p) => p.player_key === playerKey);

  const doJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const ageNum = Number(age);
    if (!name.trim()) return setError("Nama wajib diisi.");
    if (!ageNum || ageNum < 1 || ageNum > 120) return setError("Usia tidak valid.");
    if (comp?.has_pin && !/^\d{4}$/.test(pin)) return setError("PIN 4 angka wajib diisi.");
    setBusy(true);
    const profile = { name: name.trim(), age: ageNum, school: school.trim(), countryCode: country };
    saveProfile(profile);
    const res = await join({
      data: { code, pin: comp?.has_pin ? pin : null, profile: { playerKey: getPlayerKey(), ...profile } },
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    await refresh();
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

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/competitions"
          className="btn-pop inline-block rounded-full bg-white/85 px-4 py-2 font-display text-base font-bold text-foreground shadow-[var(--shadow-soft)] border-2 border-white"
        >
          ← Kompetisi
        </Link>

        <h1 className="mt-4 text-center font-display text-3xl md:text-4xl font-bold text-foreground">{comp.title}</h1>
        <p className="mt-1 text-center text-sm font-semibold text-muted-foreground">
          Kode lomba <span className="font-display text-lg text-foreground">{comp.join_code}</span>
          {comp.host_name ? ` • Host: ${comp.host_name}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-1.5 text-[11px] font-semibold">
          {(comp.ops as CompOp[]).map((o) => (
            <span key={o} className="rounded-full bg-white/80 px-2.5 py-1">{OP_LABEL_ID[o] ?? o}</span>
          ))}
          <span className="rounded-full bg-white/80 px-2.5 py-1">{DIFFICULTY_LABEL[comp.difficulty]}</span>
          <span className="rounded-full bg-white/80 px-2.5 py-1">{comp.input_type === "blind" ? "Blind" : "Choices"}</span>
          <span className="rounded-full bg-white/80 px-2.5 py-1">{comp.total_questions} soal</span>
          <span className="rounded-full bg-white/80 px-2.5 py-1">{comp.duration_seconds} detik</span>
        </div>

        {hostKey && comp.status !== "completed" && (
          <div
            className="mt-5 rounded-3xl border-4 border-white/70 p-4"
            style={{ background: "color-mix(in oklab, var(--primary) 10%, white 90%)", boxShadow: "var(--shadow-soft)" }}
          >
            <p className="font-display text-lg font-bold text-foreground">🎛️ Panel Host</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={comp.status === "live"}
                onClick={async () => {
                  const r = await start({ data: { code, hostKey } });
                  if (!r.ok) setError(r.error);
                  await refresh();
                }}
                className="btn-pop flex-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-600 px-5 py-2.5 font-display font-bold text-white disabled:opacity-50"
              >
                ▶️ Mulai
              </button>
              <button
                type="button"
                onClick={async () => {
                  const r = await stop({ data: { code, hostKey } });
                  if (!r.ok) setError(r.error);
                  await refresh();
                }}
                className="btn-pop flex-1 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-2.5 font-display font-bold text-white"
              >
                ⏹️ Stop
              </button>
            </div>
          </div>
        )}

        {comp.status === "completed" ? (
          <Link
            to="/competitions/$code/results"
            params={{ code: comp.join_code }}
            className="btn-pop mt-5 block rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3.5 text-center font-display text-xl font-bold text-white shadow-[var(--shadow-fun)] border-4 border-white/70"
          >
            🏆 Lihat Hasil Akhir
          </Link>
        ) : !me ? (
          <form
            onSubmit={doJoin}
            className="mt-5 grid gap-3 rounded-3xl border-4 border-white/70 p-4"
            style={{ background: "oklch(1 0 0 / 0.8)", boxShadow: "var(--shadow-fun)" }}
          >
            <p className="text-center font-display text-xl font-bold text-foreground">Kenalan Dulu Yuk! ✨</p>
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama" />
            <input className={field} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))} placeholder="Usia" />
            <input className={field} value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Nama Sekolah" />
            <select className={field} value={country} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
            {comp.has_pin && (
              <input className={field} inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="PIN Lomba (4 angka)" />
            )}
            {error && <p className="rounded-2xl bg-red-100 px-4 py-2 text-center text-sm font-bold text-red-700">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="btn-pop rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-6 py-3 font-display text-xl font-bold text-white shadow-[var(--shadow-fun)] border-4 border-white/70 disabled:opacity-60"
            >
              {busy ? "Mendaftar…" : "🚀 Gabung Lomba"}
            </button>
          </form>
        ) : comp.status === "live" ? (
          <button
            type="button"
            onClick={() => navigate({ to: "/competitions/$code/play", params: { code: comp.join_code } })}
            className="btn-pop mt-5 w-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-600 px-6 py-3.5 font-display text-xl font-bold text-white shadow-[var(--shadow-fun)] border-4 border-white/70"
          >
            🎮 Mulai Bermain!
          </button>
        ) : (
          <p className="mt-5 rounded-3xl border-4 border-white/70 bg-white/80 px-4 py-5 text-center font-display text-lg font-bold text-foreground">
            Kamu sudah terdaftar 🎉 Tunggu host menekan Mulai ya!
          </p>
        )}

        <h2 className="mt-6 text-center font-display text-2xl font-bold text-foreground">🏅 Papan Peringkat</h2>
        <div className="mt-3">
          <CompetitionLeaderboard participants={parts} highlightKey={playerKey} />
        </div>
      </div>
    </div>
  );
}
