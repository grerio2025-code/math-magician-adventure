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
        <span className={label}>Daftar Soal ({items.length})</span>
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
