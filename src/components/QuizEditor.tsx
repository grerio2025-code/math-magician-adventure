import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateQuizQuestions } from "@/lib/competitions.functions";

export interface QuizItem {
  prompt: string;
  choices: string[];
  correct: number;
  answer: string;
}

export const emptyItem = (): QuizItem => ({ prompt: "", choices: ["", "", ""], correct: 0, answer: "" });

const label = "block font-display text-base font-bold text-foreground mb-1";
const field =
  "w-full rounded-2xl border-4 border-white/70 bg-white/90 px-4 py-2.5 font-semibold text-foreground outline-none";

export default function QuizEditor({
  inputType,
  setInputType,
  qSeconds,
  setQSeconds,
  items,
  setItems,
}: {
  inputType: "blind" | "choices";
  setInputType: (t: "blind" | "choices") => void;
  qSeconds: number;
  setQSeconds: (n: number) => void;
  items: QuizItem[];
  setItems: (fn: (prev: QuizItem[]) => QuizItem[]) => void;
}) {
  const gen = useServerFn(generateQuizQuestions);
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(10);
  const [gType, setGType] = useState<"blind" | "choices">(inputType);
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advance">("beginner");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const runGen = async () => {
    if (topic.trim().length < 2) return setErr("Isi topik dulu ya.");
    setBusy(true);
    setErr("");
    try {
      const res = await gen({ data: { topic, count: Math.max(1, Math.min(30, count || 1)), inputType: gType, level } });
      if (!res.ok) return setErr(res.error);
      
      // Memetakan hasil soal dari AI dengan aman
      const questionsList = (res as any).questions || [];
      const newItems: QuizItem[] = questionsList.map((q: any) => {
        if (gType === "choices") {
          let ch = Array.isArray(q.choices) && q.choices.length >= 2 ? q.choices : [q.answer, ""];
          let idx = ch.findIndex((c: string) => c.trim().toLowerCase() === q.answer.trim().toLowerCase());
          if (idx < 0) { ch = [q.answer, ...ch].slice(0, 4); idx = 0; }
          
          // Acak posisi pilihan jawaban dengan aman (menggunakan variabel randIndex agar tidak konflik)
          const order = ch.map((_: string, k: number) => k);
          for (let k = order.length - 1; k > 0; k--) {
            const randIndex = Math.floor(Math.random() * (k + 1));
            [order[k], order[randIndex]] = [order[randIndex], order[k]];
          }
          ch = order.map((k) => ch[k]);
          idx = order.indexOf(idx);
          return { prompt: q.prompt, choices: ch, correct: idx, answer: q.answer };
        }
        return { prompt: q.prompt, choices: ["", "", ""], correct: 0, answer: q.answer };
      });
      
      setInputType(gType);
      setItems((prev) => [...prev.filter((p) => p.prompt.trim()), ...newItems]);
      setOpen(false);
    } catch (e: any) {
      setErr(e?.message || "Gagal membuat soal. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const update = (i: number, patch: Partial<QuizItem>) =>
    setItems((prev) => prev.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const move = (i: number, d: number) =>
    setItems((prev) => {
      const j = i + d;
      if (j < 0 || j >= prev.length) return prev;
      const arr = [...prev];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });

  return (
    <>
      <div>
        <span className={label}>Jenis Jawaban</span>
        <div className="flex gap-2">
          {(
            [
              ["blind", "Blind (ketik jawaban)"],
              ["choices", "Choices (pilih jawaban)"],
            ] as const
          ).map(([v, t]) => (
            <button
              key={v}
              type="button"
              onClick={() => setInputType(v)}
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

      <div>
        <label className={label} htmlFor="qsec">Waktu per Soal (detik)</label>
        <input id="qsec" type="number" min={5} max={600} className={field} value={qSeconds} onChange={(e) => setQSeconds(Number(e.target.value))} />
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className={label}>Daftar Soal ({items.length})</span>
          <button type="button" onClick={() => { setGType(inputType); setOpen(true); }} className="btn-pop rounded-full px-4 py-2 font-display text-sm font-bold" style={{ background: "var(--gradient-op-minus)", color: "white" }}>
            ✨ Buat Soal Otomatis
          </button>
        </div>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={() => !busy && setOpen(false)}>
            <div className="grid w-full max-w-md gap-3 rounded-3xl border-4 border-white bg-background p-5" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-display text-2xl font-bold text-foreground">✨ Buat Soal Otomatis</h3>
              <div>
                <label className={label} htmlFor="gtopic">Topik</label>
                <input id="gtopic" className={field} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="cth. Hewan, Sejarah Indonesia, Pecahan" />
              </div>
              <div>
                <label className={label} htmlFor="gcount">Jumlah Soal (maks 30)</label>
                <input id="gcount" type="number" min={1} max={30} className={field} value={count} onChange={(e) => setCount(Number(e.target.value))} />
              </div>
              <div>
                <span className={label}>Jenis Jawaban</span>
                <div className="flex gap-2">
                  {(["blind", "choices"] as const).map((v) => (
                    <button key={v} type="button" onClick={() => setGType(v)} className="btn-pop flex-1 rounded-2xl px-3 py-2 font-display text-sm font-bold"
                      style={gType === v ? { background: "var(--gradient-op-minus)", color: "white" } : { background: "white", color: "var(--foreground)" }}>
                      {v === "blind" ? "Blind" : "Choices"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className={label}>Tingkat Kesulitan</span>
                <div className="flex gap-2">
                  {([["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advance", "Advance"]] as const).map(([v, t]) => (
                    <button key={v} type="button" onClick={() => setLevel(v)} className="btn-pop flex-1 rounded-2xl px-2 py-2 font-display text-sm font-bold"
                      style={level === v ? { background: "var(--gradient-op-minus)", color: "white" } : { background: "white", color: "var(--foreground)" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {err && <p className="rounded-2xl bg-destructive/10 px-3 py-2 text-sm font-bold text-destructive">{err}</p>}
              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={() => setOpen(false)} className="btn-pop flex-1 rounded-full bg-white px-4 py-2.5 font-display font-bold text-foreground">Batal</button>
                <button type="button" disabled={busy} onClick={runGen} className="btn-pop flex-1 rounded-full px-4 py-2.5 font-display font-bold disabled:opacity-60" style={{ background: "var(--gradient-op-minus)", color: "white" }}>
                  {busy ? "Membuat…" : "Buat Soal"}
                </button>
              </div>
              <p className="text-xs font-semibold text-muted-foreground">Soal hasil otomatis ditambahkan ke daftar dan tetap bisa Anda ubah.</p>
            </div>
          </div>
        )}
        {items.map((it, i) => (
          <div key={i} className="grid gap-2 rounded-2xl border-4 border-white bg-white/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-display font-bold text-foreground">Soal {i + 1}</span>
              <span className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} className="rounded-full bg-white px-2.5 py-1 font-bold">↑</button>
                <button type="button" onClick={() => move(i, 1)} className="rounded-full bg-white px-2.5 py-1 font-bold">↓</button>
                <button
                  type="button"
                  onClick={() => setItems((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : prev))}
                  className="rounded-full bg-white px-2.5 py-1 font-bold text-destructive"
                >
                  🗑️
                </button>
              </span>
            </div>
            <textarea className={field} rows={2} value={it.prompt} onChange={(e) => update(i, { prompt: e.target.value })} placeholder="Tulis pertanyaan…" />
            {inputType === "choices" ? (
              <div className="grid gap-1.5">
                {it.choices.map((c, k) => (
                  <div key={k} className="flex items-center gap-2">
                    <input type="radio" name={`correct-${i}`} checked={it.correct === k} onChange={() => update(i, { correct: k })} aria-label="Jawaban benar" />
                    <input
                      className={field}
                      value={c}
                      onChange={(e) => update(i, { choices: it.choices.map((x, m) => (m === k ? e.target.value : x)) })}
                      placeholder={`Pilihan ${String.fromCharCode(65 + k)}`}
                    />
                  </div>
                ))}
                <div className="flex gap-2 text-sm font-bold">
                  {it.choices.length < 4 && (
                    <button type="button" onClick={() => update(i, { choices: [...it.choices, ""] })} className="rounded-full bg-white px-3 py-1">+ Pilihan</button>
                  )}
                  {it.choices.length > 2 && (
                    <button
                      type="button"
                      onClick={() => update(i, { choices: it.choices.slice(0, -1), correct: Math.min(it.correct, it.choices.length - 2) })}
                      className="rounded-full bg-white px-3 py-1"
                    >
                      − Pilihan
                    </button>
                  )}
                </div>
                <p className="text-xs font-semibold text-muted-foreground">Tandai bulatan di samping jawaban yang benar.</p>
              </div>
            ) : (
              <input className={field} value={it.answer} onChange={(e) => update(i, { answer: e.target.value })} placeholder="Jawaban benar" />
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, emptyItem()])}
          className="btn-pop rounded-full bg-white px-5 py-2.5 font-display font-bold text-foreground border-2 border-white"
        >
          ➕ Tambah Soal
        </button>
      </div>
    </>
  );
}
