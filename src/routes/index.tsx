import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Go-Q — Petualangan Berhitung Seru untuk Anak" },
      { name: "description", content: "Go-Q adalah permainan berhitung penjumlahan dan pengurangan yang seru dan berwarna untuk mengasah kemampuan matematika anak." },
      { property: "og:title", content: "Go-Q — Petualangan Berhitung Seru" },
      { property: "og:description", content: "Latih penjumlahan & pengurangan lewat 4 level menantang. Blind atau Choices, hitung skor & waktumu!" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

type LevelBtn = { op: "+" | "-"; level: 1 | 2 | 3 | 4; label: string; sub: string };

const plusBtns: LevelBtn[] = [
  { op: "+", level: 1, label: "+ Level 1", sub: "1 digit dasar" },
  { op: "+", level: 2, label: "+ Level 2", sub: "2 digit seru" },
  { op: "+", level: 3, label: "+ Level 3", sub: "3 digit jagoan" },
  { op: "+", level: 4, label: "+ Level 4", sub: "4 digit master" },
];
const minusBtns: LevelBtn[] = [
  { op: "-", level: 1, label: "- Level 1", sub: "1 digit dasar" },
  { op: "-", level: 2, label: "- Level 2", sub: "2 digit seru" },
  { op: "-", level: 3, label: "- Level 3", sub: "3 digit jagoan" },
  { op: "-", level: 4, label: "- Level 4", sub: "4 digit master" },
];

function LevelButton({ btn }: { btn: LevelBtn }) {
  const isPlus = btn.op === "+";
  return (
    <Link
      to="/play/$op/$level"
      params={{ op: isPlus ? "plus" : "minus", level: String(btn.level) }}
      className="btn-pop block rounded-3xl p-5 text-left shadow-[var(--shadow-fun)] border-4 border-white/60"
      style={{
        background: isPlus ? "var(--gradient-plus)" : "var(--gradient-minus)",
        color: "white",
      }}
    >
      <div className="font-display text-3xl font-bold drop-shadow-sm">{btn.label}</div>
      <div className="text-sm opacity-90 mt-1">{btn.sub}</div>
      <div className="mt-3 text-xs uppercase tracking-widest opacity-80">Ayo main! →</div>
    </Link>
  );
}

function Home() {
  return (
    <div className="min-h-screen px-4 py-8 md:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="text-center mb-8 md:mb-12">
          <div className="inline-block animate-pop">
            <h1 className="font-display text-6xl md:text-8xl font-bold bg-gradient-to-r from-fuchsia-500 via-orange-400 to-emerald-500 bg-clip-text text-transparent drop-shadow-sm">
              Go-Q
            </h1>
          </div>
          <p className="mt-3 text-lg md:text-xl text-foreground/80 font-semibold">
            🚀 Petualangan Berhitung Seru!
          </p>
          <p className="text-sm text-muted-foreground mt-1">Pilih tantanganmu di bawah ini</p>
        </header>

        <div className="grid grid-cols-2 gap-4 md:gap-6">
          <section>
            <h2 className="font-display text-2xl mb-3 text-center text-emerald-700">Penjumlahan ➕</h2>
            <div className="grid gap-3">
              {plusBtns.map((b) => <LevelButton key={b.label} btn={b} />)}
            </div>
          </section>
          <section>
            <h2 className="font-display text-2xl mb-3 text-center text-orange-700">Pengurangan ➖</h2>
            <div className="grid gap-3">
              {minusBtns.map((b) => <LevelButton key={b.label} btn={b} />)}
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
