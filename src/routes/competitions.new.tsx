import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { createCompetition } from "@/lib/competitions.functions";
import { OP_LABEL_ID, type CompOp } from "@/lib/competition-questions";
import { saveHostKey } from "@/lib/player";

export const Route = createFileRoute("/competitions/new")({
  head: () => ({
    meta: [
      { title: "Buat Kompetisi Baru — Go-Q" },
      { name: "description", content: "Atur lomba berhitung Go-Q: judul, PIN, jadwal, mode soal, tingkat kesulitan, durasi, dan jumlah soal." },
      { property: "og:title", content: "Buat Kompetisi Baru — Go-Q" },
      { property: "og:description", content: "Atur lomba berhitung Go-Q untuk kelas atau teman-teman." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewCompetition,
});

const ALL_OPS: CompOp[] = ["+", "-", "x", "/"];

function localNowPlus(minutes: number) {
  const d = new Date(Date.now() + minutes * 60000 - new Date().getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}

const label = "block font-display text-base font-bold text-foreground mb-1";
const field =
  "w-full rounded-2xl border-4 border-white/70 bg-white/90 px-4 py-2.5 font-semibold text-foreground outline-none";

function NewCompetition() {
  const navigate = useNavigate();
  const create = useServerFn(createCompetition);

  const [title, setTitle] = useState("");
  const [usePin, setUsePin] = useState(false);
  const [pin, setPin] = useState("");
  const [startAt, setStartAt] = useState("");
  const [ops, setOps] = useState<CompOp[]>(["+"]);
  const [difficulty, setDifficulty] = useState<"mudah" | "sedang" | "sulit">("mudah");
  const [customOn, setCustomOn] = useState(false);
  const [cmin, setCmin] = useState(1);
  const [cmax, setCmax] = useState(20);
  const [inputType, setInputType] = useState<"blind" | "choices">("choices");
  const [duration, setDuration] = useState(60);
  const [total, setTotal] = useState(50);
  const [hostName, setHostName] = useState("");
  // Generated after mount so server and client markup match (no hydration mismatch).
  const [captcha, setCaptcha] = useState<{ a: number; b: number } | null>(null);
  useEffect(() => {
    setCaptcha({ a: 1 + Math.floor(Math.random() * 9), b: 1 + Math.floor(Math.random() * 9) });
    setStartAt(localNowPlus(10));
  }, []);
  const [captchaAns, setCaptchaAns] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleOp = (o: CompOp) =>
    setOps((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]));

  const pickInput = (t: "blind" | "choices") => {
    setInputType(t);
    setDuration(t === "blind" ? 120 : 60);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Judul lomba wajib diisi.");
    if (!ops.length) return setError("Pilih minimal satu mode soal.");
    if (usePin && !/^\d{4}$/.test(pin)) return setError("PIN harus 4 angka.");
    if (!captcha) return setError("Tunggu sebentar, soal captcha sedang disiapkan.");
    if (!captchaAns.trim()) return setError("Jawab dulu soal captcha ya!");
    const startDate = startAt ? new Date(startAt) : new Date();
    if (Number.isNaN(startDate.getTime())) return setError("Tanggal & jam mulai tidak valid.");
    setBusy(true);
    try {
      const res = await create({
        data: {
          title: title.trim(),
          usePin,
          pin: usePin ? pin : null,
          startAt: startDate.toISOString(),
          ops,
          difficulty: customOn ? "custom" : difficulty,
          custom: customOn ? { min: Number(cmin), max: Number(cmax) } : null,
          inputType,
          durationSeconds: Number(duration),
          totalQuestions: Number(total),
          hostName: hostName.trim(),
          captchaA: captcha.a,
          captchaB: captcha.b,
          captchaAnswer: Number(captchaAns),
        },
      });
      if (!res.ok) {
        setError(res.error);
        setBusy(false);
        return;
      }
      saveHostKey(res.competition.join_code, res.hostKey);
      navigate({ to: "/competitions/$code", params: { code: res.competition.join_code } });
    } catch {
      setError("Gagal membuat kompetisi. Coba lagi.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/competitions"
          className="btn-pop inline-block rounded-full bg-white/85 px-4 py-2 font-display text-base font-bold text-foreground shadow-[var(--shadow-soft)] border-2 border-white"
        >
          ← Kompetisi
        </Link>

        <h1 className="mt-4 text-center font-display text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-500 via-sky-500 to-fuchsia-500 bg-clip-text text-transparent">
          ➕ Buat Kompetisi Baru
        </h1>

        <form
          onSubmit={submit}
          className="mt-5 grid gap-4 rounded-3xl border-4 border-white/70 p-4 md:p-6"
          style={{ background: "oklch(1 0 0 / 0.8)", boxShadow: "var(--shadow-fun)" }}
        >
          <div>
            <label className={label} htmlFor="title">Judul Lomba</label>
            <input id="title" className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lomba Hitung Cepat Kelas 3" />
          </div>

          <div>
            <label className={label} htmlFor="host">Nama Host (opsional)</label>
            <input id="host" className={field} value={hostName} onChange={(e) => setHostName(e.target.value)} placeholder="Bu Guru Aisyah" />
          </div>

          <div>
            <span className={label}>Keamanan</span>
            <div className="flex gap-2">
              {([[false, "Tanpa PIN"], [true, "Gunakan PIN"]] as const).map(([v, t]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setUsePin(v)}
                  className="btn-pop flex-1 rounded-2xl px-3 py-2.5 font-display font-bold"
                  style={
                    usePin === v
                      ? { background: "var(--gradient-op-plus)", color: "white" }
                      : { background: "white", color: "var(--foreground)" }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
            {usePin && (
              <input
                className={`${field} mt-2`}
                value={pin}
                inputMode="numeric"
                maxLength={4}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="PIN 4 angka"
              />
            )}
          </div>

          <div>
            <label className={label} htmlFor="start">Tanggal & Jam Mulai</label>
            <input id="start" type="datetime-local" className={field} value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </div>

          <div>
            <span className={label}>Mode Soal (bisa pilih beberapa)</span>
            <div className="grid grid-cols-2 gap-2">
              {ALL_OPS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => toggleOp(o)}
                  className="btn-pop rounded-2xl px-3 py-2.5 font-display font-bold"
                  style={
                    ops.includes(o)
                      ? { background: "var(--gradient-op-times)", color: "white" }
                      : { background: "white", color: "var(--foreground)" }
                  }
                >
                  {OP_LABEL_ID[o]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={label} htmlFor="diff">Tingkat Kesulitan</label>
            <select id="diff" className={field} value={difficulty} disabled={customOn} onChange={(e) => setDifficulty(e.target.value as any)}>
              <option value="mudah">Mudah (Level 1)</option>
              <option value="sedang">Sedang (Level 2)</option>
              <option value="sulit">Sulit (Level 3)</option>
            </select>
            <label className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <input type="checkbox" checked={customOn} onChange={(e) => setCustomOn(e.target.checked)} />
              Aturan khusus (atur sendiri rentang angka)
            </label>
            {customOn && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input type="number" className={field} value={cmin} onChange={(e) => setCmin(Number(e.target.value))} placeholder="Minimum" />
                <input type="number" className={field} value={cmax} onChange={(e) => setCmax(Number(e.target.value))} placeholder="Maksimum" />
              </div>
            )}
          </div>

          <div>
            <span className={label}>Jenis Jawaban</span>
            <div className="flex gap-2">
              {(
                [
                  ["blind", "Blind (isi jawaban)"],
                  ["choices", "Choices (3 pilihan)"],
                ] as const
              ).map(([v, t]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => pickInput(v)}
                  className="btn-pop flex-1 rounded-2xl px-3 py-2.5 font-display text-sm font-bold"
                  style={
                    inputType === v
                      ? { background: "var(--gradient-op-minus)", color: "white" }
                      : { background: "white", color: "var(--foreground)" }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={label} htmlFor="dur">Durasi (detik)</label>
              <input id="dur" type="number" min={15} max={3600} className={field} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
            <div>
              <label className={label} htmlFor="tot">Jumlah Soal</label>
              <input id="tot" type="number" min={5} max={200} className={field} value={total} onChange={(e) => setTotal(Number(e.target.value))} />
            </div>
          </div>

          <div
            className="rounded-2xl border-4 border-white p-3"
            style={{ background: "color-mix(in oklab, var(--primary) 10%, white 90%)" }}
          >
            <label className={label} htmlFor="cap">
              🧮 Buktikan kamu jago: berapa {captcha ? `${captcha.a} + ${captcha.b}` : "…"}?
            </label>
            <input id="cap" inputMode="numeric" className={field} value={captchaAns} onChange={(e) => setCaptchaAns(e.target.value.replace(/[^\d-]/g, ""))} placeholder="Jawaban" />
          </div>

          {error && (
            <p className="rounded-2xl bg-red-100 px-4 py-2 text-center text-sm font-bold text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-pop rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-6 py-3.5 font-display text-xl font-bold text-white shadow-[var(--shadow-fun)] border-4 border-white/70 disabled:opacity-60"
          >
            {busy ? "Menyimpan…" : "🚀 Simpan Kompetisi"}
          </button>
        </form>
      </div>
    </div>
  );
}
