export type FractionLevel = 1 | 2 | 3;
export type VisualType = "pie" | "bar";

export interface FractionPart {
  totalParts: number;
  shadedParts: number;
}

/** Soal pengenalan gambar (Level 1). */
export interface RecognizeQuestion {
  id: string;
  level: 1;
  question: string;
  visualType: VisualType;
  totalParts: number;
  shadedParts: number;
  options: string[];
  correctAnswer: string;
  hint: string;
}

/** Soal membandingkan dua pecahan (Level 2). */
export interface CompareQuestion {
  id: string;
  level: 2;
  question: string;
  visualType: VisualType;
  left: FractionPart;
  right: FractionPart;
  options: string[];
  correctAnswer: string;
  hint: string;
}

/** Soal penjumlahan penyebut sama (Level 3). */
export interface AddQuestion {
  id: string;
  level: 3;
  question: string;
  visualType: VisualType;
  first: FractionPart;
  second: FractionPart;
  totalParts: number;
  shadedParts: number;
  options: string[];
  correctAnswer: string;
  hint: string;
}

export type FractionQuestion = RecognizeQuestion | CompareQuestion | AddQuestion;

export const LEVEL1_QUESTIONS: RecognizeQuestion[] = [
  { id: "l1-1", level: 1, question: "Berapa nilai pecahan untuk bagian yang berwarna?", visualType: "pie", totalParts: 2, shadedParts: 1, options: ["1/2", "2/2", "1/3", "2/1"], correctAnswer: "1/2", hint: "Hitung potongan berwarna dulu, lalu semua potongan." },
  { id: "l1-2", level: 1, question: "Berapa nilai pecahan untuk bagian yang berwarna?", visualType: "pie", totalParts: 4, shadedParts: 3, options: ["3/4", "1/4", "2/4", "4/3"], correctAnswer: "3/4", hint: "Ada 4 potongan, 3 di antaranya berwarna." },
  { id: "l1-3", level: 1, question: "Berapa nilai pecahan untuk bagian yang berwarna?", visualType: "bar", totalParts: 5, shadedParts: 2, options: ["2/5", "3/5", "2/3", "5/2"], correctAnswer: "2/5", hint: "Angka atas = potongan berwarna, angka bawah = semua potongan." },
  { id: "l1-4", level: 1, question: "Berapa nilai pecahan untuk bagian yang berwarna?", visualType: "pie", totalParts: 3, shadedParts: 1, options: ["1/3", "1/2", "2/3", "3/1"], correctAnswer: "1/3", hint: "Kue dibagi 3 sama besar." },
  { id: "l1-5", level: 1, question: "Berapa nilai pecahan untuk bagian yang berwarna?", visualType: "bar", totalParts: 6, shadedParts: 4, options: ["4/6", "2/6", "4/8", "6/4"], correctAnswer: "4/6", hint: "Coba hitung lagi jumlah potongan yang diarsir!" },
  { id: "l1-6", level: 1, question: "Berapa nilai pecahan untuk bagian yang berwarna?", visualType: "pie", totalParts: 8, shadedParts: 5, options: ["5/8", "3/8", "5/6", "8/5"], correctAnswer: "5/8", hint: "Pizza dibagi 8 potong." },
  { id: "l1-7", level: 1, question: "Berapa nilai pecahan untuk bagian yang berwarna?", visualType: "bar", totalParts: 4, shadedParts: 1, options: ["1/4", "1/3", "3/4", "4/1"], correctAnswer: "1/4", hint: "Hanya satu potongan yang berwarna." },
  { id: "l1-8", level: 1, question: "Berapa nilai pecahan untuk bagian yang berwarna?", visualType: "pie", totalParts: 6, shadedParts: 3, options: ["3/6", "2/6", "3/4", "6/3"], correctAnswer: "3/6", hint: "Setengah bagian juga bisa ditulis 3/6." },
  { id: "l1-9", level: 1, question: "Berapa nilai pecahan untuk bagian yang berwarna?", visualType: "bar", totalParts: 8, shadedParts: 2, options: ["2/8", "2/6", "6/8", "8/2"], correctAnswer: "2/8", hint: "Cokelat dibagi 8 kotak." },
  { id: "l1-10", level: 1, question: "Berapa nilai pecahan untuk bagian yang berwarna?", visualType: "pie", totalParts: 5, shadedParts: 4, options: ["4/5", "1/5", "4/6", "5/4"], correctAnswer: "4/5", hint: "Hampir semua potongan berwarna." },
  { id: "l1-11", level: 1, question: "Berapa nilai pecahan untuk bagian yang berwarna?", visualType: "bar", totalParts: 10, shadedParts: 7, options: ["7/10", "3/10", "7/8", "10/7"], correctAnswer: "7/10", hint: "Hitung kotak berwarna satu per satu." },
  { id: "l1-12", level: 1, question: "Berapa nilai pecahan untuk bagian yang berwarna?", visualType: "pie", totalParts: 4, shadedParts: 2, options: ["2/4", "1/4", "2/3", "4/2"], correctAnswer: "2/4", hint: "Dua dari empat potongan berwarna." },
];

const cmp = (a: FractionPart, b: FractionPart) => {
  const x = a.shadedParts / a.totalParts;
  const y = b.shadedParts / b.totalParts;
  return x > y ? ">" : x < y ? "<" : "=";
};

const compare = (
  id: string,
  visualType: VisualType,
  left: FractionPart,
  right: FractionPart,
  hint: string,
): CompareQuestion => ({
  id,
  level: 2,
  question: "Isi titik-titik dengan simbol yang tepat",
  visualType,
  left,
  right,
  options: [">", "<", "="],
  correctAnswer: cmp(left, right),
  hint,
});

export const LEVEL2_QUESTIONS: CompareQuestion[] = [
  compare("l2-1", "pie", { totalParts: 2, shadedParts: 1 }, { totalParts: 4, shadedParts: 1 }, "Lihat gambar: mana yang bagian berwarnanya lebih luas?"),
  compare("l2-2", "bar", { totalParts: 5, shadedParts: 2 }, { totalParts: 5, shadedParts: 4 }, "Penyebut sama, bandingkan angka atasnya."),
  compare("l2-3", "pie", { totalParts: 4, shadedParts: 2 }, { totalParts: 2, shadedParts: 1 }, "2/4 dan 1/2 sama besar, lihat gambarnya."),
  compare("l2-4", "bar", { totalParts: 6, shadedParts: 5 }, { totalParts: 6, shadedParts: 3 }, "Penyebut sama, yang pembilangnya besar lebih besar."),
  compare("l2-5", "pie", { totalParts: 3, shadedParts: 1 }, { totalParts: 6, shadedParts: 4 }, "Bandingkan luas bagian berwarna pada kedua gambar."),
  compare("l2-6", "bar", { totalParts: 8, shadedParts: 4 }, { totalParts: 4, shadedParts: 2 }, "Coba sederhanakan 4/8 dulu."),
  compare("l2-7", "pie", { totalParts: 8, shadedParts: 7 }, { totalParts: 4, shadedParts: 3 }, "Mana yang lebih dekat ke penuh?"),
  compare("l2-8", "bar", { totalParts: 10, shadedParts: 3 }, { totalParts: 5, shadedParts: 3 }, "Potongan yang lebih banyak membuat tiap potongan lebih kecil."),
  compare("l2-9", "pie", { totalParts: 6, shadedParts: 1 }, { totalParts: 3, shadedParts: 1 }, "Makin banyak potongan, satu potongnya makin kecil."),
  compare("l2-10", "bar", { totalParts: 4, shadedParts: 3 }, { totalParts: 8, shadedParts: 6 }, "3/4 dan 6/8 itu kembar!"),
];

function simplifyLabel(n: number, d: number) {
  return `${n}/${d}`;
}

const add = (
  id: string,
  visualType: VisualType,
  d: number,
  a: number,
  b: number,
  wrongs: string[],
  hint: string,
): AddQuestion => ({
  id,
  level: 3,
  question: `${a}/${d} + ${b}/${d} = ?`,
  visualType,
  first: { totalParts: d, shadedParts: a },
  second: { totalParts: d, shadedParts: b },
  totalParts: d,
  shadedParts: a + b,
  options: [simplifyLabel(a + b, d), ...wrongs],
  correctAnswer: simplifyLabel(a + b, d),
  hint,
});

export const LEVEL3_QUESTIONS: AddQuestion[] = [
  add("l3-1", "bar", 5, 1, 2, ["3/10", "2/5", "4/5"], "Penyebut tetap 5, jumlahkan angka atasnya saja."),
  add("l3-2", "bar", 4, 1, 2, ["3/8", "2/4", "4/4"], "1 + 2 = 3, penyebutnya tetap 4."),
  add("l3-3", "pie", 6, 2, 3, ["5/12", "4/6", "6/6"], "Gabungkan potongan kedua pizza."),
  add("l3-4", "bar", 8, 3, 4, ["7/16", "6/8", "8/8"], "Penyebut sama, jangan ditambah."),
  add("l3-5", "pie", 3, 1, 1, ["2/6", "1/3", "3/3"], "Satu potong ditambah satu potong jadi dua potong."),
  add("l3-6", "bar", 10, 4, 3, ["7/20", "6/10", "8/10"], "4 + 3 = 7 dari 10 bagian."),
  add("l3-7", "pie", 4, 1, 1, ["2/8", "1/4", "3/4"], "Dua potong dari empat potong."),
  add("l3-8", "bar", 7, 2, 4, ["6/14", "5/7", "7/7"], "Penyebut 7 tetap."),
  add("l3-9", "pie", 8, 2, 5, ["7/16", "6/8", "8/8"], "Hitung total potongan berwarna."),
  add("l3-10", "bar", 6, 1, 4, ["5/12", "4/6", "6/6"], "1 + 4 = 5 dari 6 bagian."),
];

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const QUIZ_LENGTH = 10;
export const POINTS_PER_CORRECT = 20;
export const MAX_LIVES = 3;

export function buildQuiz(level: FractionLevel): FractionQuestion[] {
  const pool: FractionQuestion[] =
    level === 1 ? LEVEL1_QUESTIONS : level === 2 ? LEVEL2_QUESTIONS : LEVEL3_QUESTIONS;
  return shuffle(pool)
    .slice(0, QUIZ_LENGTH)
    .map((q) => ({ ...q, options: shuffle(q.options) }));
}

export const LEVEL_TITLES: Record<FractionLevel, string> = {
  1: "Mengenal Gambar",
  2: "Bandingkan Nilai",
  3: "Penjumlahan Dasar",
};

export function starsFor(correct: number, total: number): 1 | 2 | 3 {
  const pct = total ? correct / total : 0;
  if (pct >= 0.8) return 3;
  if (pct >= 0.5) return 2;
  return 1;
}

export function motivationFor(stars: 1 | 2 | 3): string {
  if (stars === 3) return "Hebat! Kamu Makin Jago Pecahan!";
  if (stars === 2) return "Bagus! Sedikit lagi jadi juara pecahan!";
  return "Semangat! Coba lagi ya, kamu pasti bisa!";
}
