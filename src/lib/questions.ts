export type Op = "+" | "-" | "x" | "/";
export type Mode = "blind" | "choices";

export interface Fact {
  a: number;
  b: number;
  op: "x" | "/";
  answer: number;
}

export interface Question {
  a: number;
  b: number;
  op: Op;
  answer: number;
  choices?: number[];
  /** memory-mode: facts to show before the question */
  shown?: Fact[];
  /** memory-mode: seconds to display shown facts */
  hideSeconds?: number;
}

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Levels for addition/subtraction only. */
export type PlusMinusLevel = 1 | 2 | 3 | 4;
/** Levels for multiplication/division. */
export type TimesDivLevel = 1 | 2 | 3;

// ---------- Addition / Subtraction (unchanged) ----------

function genPair(op: "+" | "-", level: PlusMinusLevel, phase: 0 | 1 | 2 | 3): [number, number] {
  if (op === "+") {
    if (level === 1) {
      if (phase === 0) return [rand(1, 4), rand(1, 4)];
      if (phase === 1) return [rand(5, 9), rand(5, 9)];
      if (phase === 2) {
        const one = rand(1, 9), two = rand(10, 30);
        return Math.random() < 0.5 ? [one, two] : [two, one];
      }
      const one = rand(1, 9), two = rand(31, 99);
      return Math.random() < 0.5 ? [one, two] : [two, one];
    }
    if (level === 2) {
      if (phase === 0) return [rand(10, 40), rand(10, 40)];
      if (phase === 1) return [rand(41, 99), rand(41, 99)];
      if (phase === 2) {
        const two = rand(10, 40), three = rand(100, 300);
        return Math.random() < 0.5 ? [two, three] : [three, two];
      }
      const two = rand(41, 99), three = rand(301, 999);
      return Math.random() < 0.5 ? [two, three] : [three, two];
    }
    if (level === 3) {
      if (phase === 0) return [rand(100, 400), rand(100, 400)];
      if (phase === 1) return [rand(401, 999), rand(401, 999)];
      if (phase === 2) {
        const three = rand(100, 400), four = rand(1000, 3000);
        return Math.random() < 0.5 ? [three, four] : [four, three];
      }
      const three = rand(401, 999), four = rand(3001, 9999);
      return Math.random() < 0.5 ? [three, four] : [four, three];
    }
    if (phase === 0) return [rand(1000, 4000), rand(1000, 4000)];
    if (phase === 1) return [rand(4001, 9999), rand(4001, 9999)];
    if (phase === 2) {
      const four = rand(1000, 4000), five = rand(10000, 30000);
      return Math.random() < 0.5 ? [four, five] : [five, four];
    }
    const four = rand(4001, 9999), five = rand(30001, 99999);
    return Math.random() < 0.5 ? [four, five] : [five, four];
  }

  const orderDesc = (x: number, y: number): [number, number] =>
    x >= y ? [x, y] : [y, x];

  if (level === 1) {
    if (phase === 0) return orderDesc(rand(1, 4), rand(1, 4));
    if (phase === 1) return orderDesc(rand(5, 9), rand(5, 9));
    if (phase === 2) return orderDesc(rand(10, 30), rand(1, 9));
    return orderDesc(rand(31, 99), rand(1, 9));
  }
  if (level === 2) {
    if (phase === 0) return orderDesc(rand(10, 40), rand(10, 40));
    if (phase === 1) return orderDesc(rand(41, 99), rand(41, 99));
    if (phase === 2) return orderDesc(rand(100, 300), rand(10, 40));
    return orderDesc(rand(301, 999), rand(41, 99));
  }
  if (level === 3) {
    if (phase === 0) return orderDesc(rand(100, 400), rand(100, 400));
    if (phase === 1) return orderDesc(rand(401, 999), rand(401, 999));
    if (phase === 2) return orderDesc(rand(1000, 3000), rand(100, 400));
    return orderDesc(rand(3001, 9999), rand(401, 999));
  }
  if (phase === 0) return orderDesc(rand(1000, 4000), rand(1000, 4000));
  if (phase === 1) return orderDesc(rand(4001, 9999), rand(4001, 9999));
  if (phase === 2) return orderDesc(rand(10000, 30000), rand(1000, 4000));
  return orderDesc(rand(30001, 99999), rand(4001, 9999));
}

function makeChoices(answer: number, count = 3): number[] {
  const set = new Set<number>([answer]);
  const spread = Math.max(2, Math.round(Math.abs(answer) * 0.2) + 2);
  let guard = 0;
  while (set.size < count && guard++ < 200) {
    const delta = rand(-spread, spread);
    if (delta === 0) continue;
    const wrong = answer + delta;
    if (wrong < 0) continue;
    set.add(wrong);
  }
  return shuffle(Array.from(set));
}

function plusMinusQuestions(op: "+" | "-", level: PlusMinusLevel, mode: Mode): Question[] {
  const phases: { count: number; phase: 0 | 1 | 2 | 3 }[] = [
    { count: 10, phase: 0 },
    { count: 10, phase: 1 },
    { count: 10, phase: 2 },
    { count: 20, phase: 3 },
  ];
  const qs: Question[] = [];
  for (const { count, phase } of phases) {
    for (let i = 0; i < count; i++) {
      const [a, b] = genPair(op, level, phase);
      const answer = op === "+" ? a + b : a - b;
      const q: Question = { a, b, op, answer };
      if (mode === "choices") q.choices = makeChoices(answer);
      qs.push(q);
    }
  }
  return qs;
}

// ---------- Multiplication / Division ----------

/** Build the 5-fact pool for a given "table" N. */
function tablePool(op: "x" | "/", N: number): Fact[] {
  const facts: Fact[] = [];
  for (let m = 1; m <= 5; m++) {
    if (op === "x") facts.push({ a: N, b: m, op: "x", answer: N * m });
    else facts.push({ a: N * m, b: N, op: "/", answer: m });
  }
  return facts;
}

function memoryQuestions(op: "x" | "/", tables: number[]): Question[] {
  const out: Question[] = [];
  // pattern per table: 3 soal × 2 shown, 3 soal × 3 shown, 4 soal × 4 shown  (=10)
  const pattern: { k: 2 | 3 | 4; count: number }[] = [
    { k: 2, count: 3 },
    { k: 3, count: 3 },
    { k: 4, count: 4 },
  ];
  for (const N of tables) {
    const pool = tablePool(op, N);
    for (const { k, count } of pattern) {
      for (let i = 0; i < count; i++) {
        const shown = shuffle(pool).slice(0, k);
        const target = shown[Math.floor(Math.random() * shown.length)];
        const others = shown.filter((f) => f.answer !== target.answer);
        let wrong: number;
        if (others.length) {
          wrong = others[Math.floor(Math.random() * others.length)].answer;
        } else {
          const delta = Math.random() < 0.5 ? -1 : 1;
          wrong = Math.max(0, target.answer + delta);
          if (wrong === target.answer) wrong = target.answer + 1;
        }
        out.push({
          a: target.a,
          b: target.b,
          op,
          answer: target.answer,
          shown,
          hideSeconds: k,
          choices: shuffle([target.answer, wrong]),
        });
      }
    }
  }
  return out;
}

function randomTimesQuestion(pool: number[]): Question {
  const a = pool[Math.floor(Math.random() * pool.length)];
  const b = rand(1, 10);
  const [x, y] = Math.random() < 0.5 ? [a, b] : [b, a];
  return { a: x, b: y, op: "x", answer: x * y };
}

function randomDivideQuestion(pool: number[]): Question {
  const divisor = pool[Math.floor(Math.random() * pool.length)];
  const quotient = rand(1, 10);
  const dividend = divisor * quotient;
  return { a: dividend, b: divisor, op: "/", answer: quotient };
}

function timesDivideL3(op: "x" | "/", mode: Mode): Question[] {
  const groups: { pool: number[]; count: number }[] = [
    { pool: [1, 2, 3], count: 10 },
    { pool: [4, 5, 6], count: 20 },
    { pool: [7, 8, 9], count: 20 },
  ];
  const out: Question[] = [];
  for (const { pool, count } of groups) {
    for (let i = 0; i < count; i++) {
      const q = op === "x" ? randomTimesQuestion(pool) : randomDivideQuestion(pool);
      if (mode === "choices") q.choices = makeChoices(q.answer, 3);
      out.push(q);
    }
  }
  return out;
}

// ---------- Entry ----------

export function generateQuestions(
  op: Op,
  level: number,
  mode: Mode,
): Question[] {
  if (op === "+" || op === "-") {
    const lvl = Math.min(4, Math.max(1, level)) as PlusMinusLevel;
    return plusMinusQuestions(op, lvl, mode);
  }
  const lvl = Math.min(3, Math.max(1, level)) as TimesDivLevel;
  if (lvl === 1) return memoryQuestions(op, [1, 2, 3, 4, 5]);
  if (lvl === 2) return memoryQuestions(op, [6, 7, 8, 9, 10]);
  return timesDivideL3(op, mode);
}

/** Whether this op+level uses the memory (hafalan) flow. */
export function isMemoryLevel(op: Op, level: number): boolean {
  return (op === "x" || op === "/") && (level === 1 || level === 2);
}
