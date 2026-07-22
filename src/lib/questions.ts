export type Op = "+" | "-";
export type Mode = "blind" | "choices";

export interface Question {
  a: number;
  b: number;
  op: Op;
  answer: number;
  choices?: number[];
}

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Generate operand pairs per level & phase
// phase 0-3 for + levels, 0-3 for - levels (each level has 4 phases: 10/10/10/20)
function genPair(op: Op, level: 1 | 2 | 3 | 4, phase: 0 | 1 | 2 | 3): [number, number] {
  if (op === "+") {
    if (level === 1) {
      if (phase === 0) return [rand(1, 4), rand(1, 4)];
      if (phase === 1) return [rand(5, 9), rand(5, 9)];
      if (phase === 2) {
        // 1-digit + 2-digit small, random order
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
    // level 4
    if (phase === 0) return [rand(1000, 4000), rand(1000, 4000)];
    if (phase === 1) return [rand(4001, 9999), rand(4001, 9999)];
    if (phase === 2) {
      const four = rand(1000, 4000), five = rand(10000, 30000);
      return Math.random() < 0.5 ? [four, five] : [five, four];
    }
    const four = rand(4001, 9999), five = rand(30001, 99999);
    return Math.random() < 0.5 ? [four, five] : [five, four];
  }

  // subtraction — always ensure a >= b so result >= 0
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

function makeChoices(answer: number): number[] {
  const set = new Set<number>([answer]);
  const spread = Math.max(2, Math.round(Math.abs(answer) * 0.2) + 2);
  while (set.size < 3) {
    const delta = rand(-spread, spread);
    if (delta === 0) continue;
    const wrong = answer + delta;
    if (wrong < 0) continue;
    set.add(wrong);
  }
  const arr = Array.from(set);
  // shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateQuestions(
  op: Op,
  level: 1 | 2 | 3 | 4,
  mode: Mode,
): Question[] {
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
