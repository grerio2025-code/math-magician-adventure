import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Go-Q — Go Count and Memorize Numbers with Q" },
      { name: "description", content: "Go-Q: permainan berhitung penjumlahan, pengurangan, perkalian, dan pembagian yang seru dan berwarna untuk anak." },
      { property: "og:title", content: "Go-Q — Go Count and Memorize Numbers with Q" },
      { property: "og:description", content: "Latih penjumlahan, pengurangan, perkalian & pembagian lewat level menantang. Blind, Choices, atau Hafalan!" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

type OpKey = "plus" | "minus" | "times" | "divide";
type LevelBtn = { op: OpKey; level: number; label: string; sub: string };

const plusBtns: LevelBtn[] = [
  { op: "plus", level: 1, label: "+ Level 1", sub: "1 digit dasar" },
  { op: "plus", level: 2, label: "+ Level 2", sub: "2 digit seru" },
  { op: "plus", level: 3, label: "+ Level 3", sub: "3 digit jagoan" },
  { op: "plus", level: 4, label: "HC Level 1", sub: "Lomba Hitung Cepat" },
];
const minusBtns: LevelBtn[] = [
  { op: "minus", level: 1, label: "- Level 1", sub: "1 digit dasar" },
  { op: "minus", level: 2, label: "- Level 2", sub: "2 digit seru" },
  { op: "minus", level: 3, label: "- Level 3", sub: "3 digit jagoan" },
  { op: "minus", level: 4, label: "HC Level 2", sub: "Lomba Hitung Cepat" },
];
const timesBtns: LevelBtn[] = [
  { op: "times", level: 1, label: "× Level 1", sub: "Hafal 1–5" },
  { op: "times", level: 2, label: "× Level 2", sub: "Hafal 6–10" },
  { op: "times", level: 3, label: "× Level 3", sub: "Acak jagoan" },
];
const divideBtns: LevelBtn[] = [
  { op: "divide", level: 1, label: "÷ Level 1", sub: "Hafal 1–5" },
  { op: "divide", level: 2, label: "÷ Level 2", sub: "Hafal 6–10" },
  { op: "divide", level: 3, label: "÷ Level 3", sub: "Acak jagoan" },
];

function LevelButton({ btn }: { btn: LevelBtn }) {
  const isHC = (btn.op === "plus" || btn.op === "minus") && btn.level === 4;
  const bg = isHC
    ? "linear-gradient(135deg, #4b5563, #1f2937)"
    : btn.op === "plus"
    ? "var(--gradient-plus)"
    : btn.op === "minus"
    ? "var(--gradient-minus)"
    : btn.op === "times"
    ? "linear-gradient(135deg, #6366f1, #a855f7)"
    : "linear-gradient(135deg, #0ea5e9, #14b8a6)";
  return (
    <Link
      to="/play/$op/$level"
      params={{ op: btn.op, level: String(btn.level) }}
      className="btn-pop block rounded-3xl p-4 md:p-5 text-left shadow-[var(--shadow-fun)] border-4 border-white/60"
      style={{ background: bg, color: "white" }}
    >
      <div className="font-display text-2xl md:text-3xl font-bold drop-shadow-sm">{btn.label}</div>
      <div className="text-xs md:text-sm opacity-90 mt-1">{btn.sub}</div>
    </Link>
  );
}

async function shareApp() {
  const url = typeof window !== "undefined" ? window.location.origin : "";
  const data = {
    title: "Go-Q",
    text: "Yuk main Go-Q — asah kemampuan berhitung dengan seru!",
    url,
  };
  try {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      await (navigator as any).share(data);
      return;
    }
  } catch {
    // user cancelled or share failed — fall through to clipboard
  }
  try {
    await navigator.clipboard.writeText(url);
    alert("Link Go-Q disalin ke clipboard!");
  } catch {
    alert(url);
  }
}


function Home() {
  return (
    <div className="min-h-screen px-4 py-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="text-center mb-8 md:mb-12">
          <div className="inline-block animate-pop">
            <h1 className="font-display text-6xl md:text-8xl font-bold bg-gradient-to-r from-fuchsia-500 via-orange-400 to-emerald-500 bg-clip-text text-transparent drop-shadow-sm">
              Go-Q
            </h1>
          </div>
          <p className="mt-3 text-base md:text-xl text-foreground/80 font-semibold">
            Go Count and Memorize Numbers with Q
          </p>
          <p className="text-sm text-muted-foreground mt-1">untuk Ananda Quddus MIN 5 Ulee Kareng - Banda Aceh</p>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <section>
            <h2 className="font-display text-base sm:text-2xl mb-3 text-center text-emerald-700 whitespace-nowrap">Penjumlahan ➕</h2>
            <div className="grid gap-3">
              {plusBtns.map((b) => <LevelButton key={b.label} btn={b} />)}
            </div>
          </section>
          <section>
            <h2 className="font-display text-base sm:text-2xl mb-3 text-center text-orange-700 whitespace-nowrap">Pengurangan ➖</h2>
            <div className="grid gap-3">
              {minusBtns.map((b) => <LevelButton key={b.label} btn={b} />)}
            </div>
          </section>
          <section>
            <h2 className="font-display text-base sm:text-2xl mb-3 text-center text-indigo-700 whitespace-nowrap">Perkalian ✖</h2>
            <div className="grid gap-3">
              {timesBtns.map((b) => <LevelButton key={b.label} btn={b} />)}
            </div>
          </section>
          <section>
            <h2 className="font-display text-base sm:text-2xl mb-3 text-center text-cyan-700 whitespace-nowrap">Pembagian ➗</h2>
            <div className="grid gap-3">
              {divideBtns.map((b) => <LevelButton key={b.label} btn={b} />)}
            </div>
          </section>
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/ranking"
            className="btn-pop inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-8 py-4 font-display text-xl font-bold text-white shadow-[var(--shadow-fun)] border-4 border-white/70"
          >
            🏆 Ranking
          </Link>
        </div>
      </div>
    </div>
  );
}
