export type CompOp = "+" | "-" | "x" | "/";
export type CompDifficulty = "mudah" | "sedang" | "sulit" | "custom";

export interface CompQuestion {
  a: number;
  b: number;
  op: CompOp;
  answer: number;
  display: string;
  choices?: number[];
}

export interface CustomRange {
  min?: number;
  max?: number;
  /** "Tebak Angka Hilang": sembunyikan salah satu angka dengan "?" */
  missing?: boolean;
}

/** Deterministic PRNG so every participant gets identical questions. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rangeFor(difficulty: CompDifficulty, custom?: CustomRange | null): CustomRange {
  if (difficulty === "custom" && custom) {
    const min = Math.max(0, Math.min(custom.min, custom.max));
    const max = Math.max(1, Math.max(custom.min, custom.max));
    return { min, max };
  }
  if (difficulty === "mudah") return { min: 1, max: 9 };
  if (difficulty === "sedang") return { min: 10, max: 99 };
  return { min: 100, max: 999 };
}

function tableMaxFor(difficulty: CompDifficulty, custom?: CustomRange | null): number {
  if (difficulty === "custom" && custom) return Math.max(2, Math.min(20, custom.max));
  if (difficulty === "mudah") return 5;
  if (difficulty === "sedang") return 10;
  return 12;
}

export function opSymbol(op: CompOp): string {
  if (op === "x") return "×";
  if (op === "/") return "÷";
  if (op === "-") return "−";
  return "+";
}

export function generateCompetitionQuestions(params: {
  ops: CompOp[];
  difficulty: CompDifficulty;
  custom?: CustomRange | null;
  inputType: "blind" | "choices";
  total: number;
  seed: number;
}): CompQuestion[] {
  const { ops, difficulty, custom, inputType, total, seed } = params;
  const rnd = mulberry32(seed);
  const int = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
  const { min, max } = rangeFor(difficulty, custom);
  const tableMax = tableMaxFor(difficulty, custom);
  const pool = ops.length ? ops : (["+"] as CompOp[]);

  const out: CompQuestion[] = [];
  for (let i = 0; i < total; i++) {
    const op = pool[i % pool.length];
    let a: number, b: number, answer: number;
    if (op === "+") {
      a = int(min, max);
      b = int(min, max);
      answer = a + b;
    } else if (op === "-") {
      const x = int(min, max);
      const y = int(min, max);
      a = Math.max(x, y);
      b = Math.min(x, y);
      answer = a - b;
    } else if (op === "x") {
      a = int(1, tableMax);
      b = int(1, 10);
      answer = a * b;
    } else {
      b = int(1, tableMax);
      answer = int(1, 10);
      a = b * answer;
    }
    const q: CompQuestion = {
      a,
      b,
      op,
      answer,
      display: `${a} ${opSymbol(op)} ${b}`,
    };
    if (inputType === "choices") {
      const set = new Set<number>([answer]);
      let guard = 0;
      while (set.size < 3 && guard++ < 40) {
        const delta = int(1, Math.max(3, Math.round(Math.abs(answer) * 0.2) || 3));
        const cand = rnd() < 0.5 ? answer - delta : answer + delta;
        if (cand >= 0 && cand !== answer) set.add(cand);
      }
      let extra = answer + 1;
      while (set.size < 3) set.add(extra++);
      const arr = Array.from(set);
      for (let j = arr.length - 1; j > 0; j--) {
        const k = Math.floor(rnd() * (j + 1));
        [arr[j], arr[k]] = [arr[k], arr[j]];
      }
      q.choices = arr;
    }
    // shuffle the op order lightly by pool rotation only (keeps determinism)
    out.push(q);
  }
  return out;
}

export const OP_LABEL_ID: Record<CompOp, string> = {
  "+": "Penjumlahan",
  "-": "Pengurangan",
  x: "Perkalian",
  "/": "Pembagian",
};

export const DIFFICULTY_LABEL: Record<CompDifficulty, string> = {
  mudah: "Mudah",
  sedang: "Sedang",
  sulit: "Sulit",
  custom: "Khusus",
};
