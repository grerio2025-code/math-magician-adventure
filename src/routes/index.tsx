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
type LevelBtn = { op: OpKey; level: number; label: string; sub: string; icon: string };

const plusBtns: LevelBtn[] = [
  { op: "plus", level: 1, label: "Level 1", sub: "1 digit dasar", icon: "🏆" },
  { op: "plus", level: 2, label: "Level 2", sub: "2 digit seru", icon: "⚡" },
  { op: "plus", level: 3, label: "Level 3", sub: "3 digit jagoan", icon: "🚀" },
  { op: "plus", level: 4, label: "HC Level 1", sub: "Lomba Hitung Cepat", icon: "👑" },
];
const minusBtns: LevelBtn[] = [
  { op: "minus", level: 1, label: "Level 1", sub: "1 digit dasar", icon: "🏆" },
  { op: "minus", level: 2, label: "Level 2", sub: "2 digit seru", icon: "⚡" },
  { op: "minus", level: 3, label: "Level 3", sub: "3 digit jagoan", icon: "🚀" },
  { op: "minus", level: 4, label: "HC Level 2", sub: "Lomba Hitung Cepat", icon: "👑" },
];
const timesBtns: LevelBtn[] = [
  { op: "times", level: 1, label: "Level 1", sub: "Hafal 1–5", icon: "🏆" },
  { op: "times", level: 2, label: "Level 2", sub: "Hafal 6–10", icon: "⚡" },
  { op: "times", level: 3, label: "Level 3", sub: "Acak jagoan", icon: "🚀" },
];
const divideBtns: LevelBtn[] = [
  { op: "divide", level: 1, label: "Level 1", sub: "Hafal 1–5", icon: "🏆" },
  { op: "divide", level: 2, label: "Level 2", sub: "Hafal 6–10", icon: "⚡" },
  { op: "divide", level: 3, label: "Level 3", sub: "Acak jagoan", icon: "🚀" },
];

const OP_META: Record<OpKey, { title: string; sub: string; symbol: string; gradient: string; card: string; pill: string }> = {
  plus: {
    title: "Penjumlahan",
    sub: "Tambah dan Kuasai",
    symbol: "＋",
    gradient: "var(--gradient-op-plus)",
    card: "color-mix(in oklab, var(--op-plus) 8%, white 92%)",
    pill: "color-mix(in oklab, var(--op-plus) 12%, white 88%)",
  },
  minus: {
    title: "Pengurangan",
    sub: "Kurangi dengan Cermat",
    symbol: "－",
    gradient: "var(--gradient-op-minus)",
    card: "color-mix(in oklab, var(--op-minus) 8%, white 92%)",
    pill: "color-mix(in oklab, var(--op-minus) 12%, white 88%)",
  },
  times: {
    title: "Perkalian",
    sub: "Latih Otak Logis",
    symbol: "✕",
    gradient: "var(--gradient-op-times)",
    card: "color-mix(in oklab, var(--op-times) 7%, white 93%)",
    pill: "color-mix(in oklab, var(--op-times) 11%, white 89%)",
  },
  divide: {
    title: "Pembagian",
    sub: "Pecahkan dengan Tepat",
    symbol: "÷",
    gradient: "var(--gradient-op-divide)",
    card: "color-mix(in oklab, var(--op-divide) 8%, white 92%)",
    pill: "color-mix(in oklab, var(--op-divide) 12%, white 88%)",
  },
};

function LevelRow({ btn }: { btn: LevelBtn }) {
  const meta = OP_META[btn.op];
  const isHC = (btn.op === "plus" || btn.op === "minus") && btn.level === 4;
  return (
    <Link
      to="/play/$op/$level"
      params={{ op: btn.op, level: String(btn.level) }}
      className="btn-pop flex items-center gap-3 rounded-2xl px-3 py-2.5 border-2"
      style={{
        background: isHC ? "color-mix(in oklab, var(--primary) 10%, white 90%)" : meta.pill,
        borderColor: isHC ? "var(--primary)" : "oklch(1 0 0 / 0.8)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg"
        style={{ background: "oklch(1 0 0 / 0.85)", boxShadow: "var(--shadow-soft)" }}
      >
        {btn.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg md:text-xl font-bold text-foreground leading-tight">
          {btn.label}
        </span>
        <span className="block text-xs text-muted-foreground truncate">{btn.sub}</span>
      </span>
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
        style={{ background: isHC ? "var(--gradient-op-hc)" : meta.gradient }}
      >
        ›
      </span>
    </Link>
  );
}

function OpCard({ op, items }: { op: OpKey; items: LevelBtn[] }) {
  const meta = OP_META[op];
  return (
    <section
      className="overflow-hidden rounded-3xl border-4 border-white/70"
      style={{ background: meta.card, boxShadow: "var(--shadow-fun)" }}
    >
      <header
        className="flex items-center gap-3 px-4 py-3"
        style={{ background: meta.gradient, color: "white" }}
      >
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-xl font-bold"
          style={{ background: "oklch(1 0 0 / 0.25)" }}
        >
          {meta.symbol}
        </span>
        <span className="min-w-0">
          <span className="block font-display text-lg md:text-2xl font-bold leading-tight whitespace-nowrap">
            {meta.title}
          </span>
          <span className="block text-[11px] md:text-xs opacity-90">{meta.sub}</span>
        </span>
      </header>
      <div className="grid gap-2.5 p-3">
        {items.map((b) => (
          <LevelRow key={b.label} btn={b} />
        ))}
      </div>
    </section>
  );
}


async function shareApp() {
  const url = typeof window !== "undefined" ? window.location.origin : "";
  const data = {
    title: "Go-Q",
    text: "Yuk main Go-Q — asah kemampuan berhitung dengan seru!",
    url,
  };
  if (typeof navigator !== "undefined" && typeof (navigator as any).share === "function") {
    try {
      await (navigator as any).share(data);
    } catch {
      // user cancelled or share failed — do not fall back
    }
    return;
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
    <div className="relative min-h-screen overflow-hidden px-4 py-8 md:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-4 right-2 select-none font-display text-6xl md:text-8xl font-bold opacity-10"
        style={{ color: "var(--primary)" }}
      >
        2 4 ＋ ✕ 3 － ÷ 5
      </div>

      <div className="relative mx-auto max-w-6xl">
        <header className="text-center mb-8 md:mb-10">
          <div className="inline-block animate-pop">
            <h1 className="font-display text-6xl md:text-8xl font-bold bg-gradient-to-r from-fuchsia-500 via-orange-400 to-emerald-500 bg-clip-text text-transparent drop-shadow-sm">
              Go-Q
            </h1>
          </div>
          <p className="mt-3 font-display text-xl md:text-3xl font-bold text-foreground">
            Go Count and Memorize Numbers with Q
          </p>
          <p className="mt-1 text-sm md:text-lg text-muted-foreground font-semibold">
            Belajar Hitung • Latih Ingatan • Raih Prestasi
          </p>
          <div
            className="mx-auto mt-3 h-1.5 w-40 rounded-full"
            style={{ background: "linear-gradient(90deg, var(--op-times), var(--op-minus), var(--op-plus))" }}
          />
          <p className="text-xs text-muted-foreground mt-3">
            untuk Ananda Quddus MIN 5 Ulee Kareng - Banda Aceh
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <OpCard op="plus" items={plusBtns} />
          <OpCard op="minus" items={minusBtns} />
          <OpCard op="times" items={timesBtns} />
          <OpCard op="divide" items={divideBtns} />
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/ranking"
            className="btn-pop inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-8 py-4 font-display text-xl font-bold text-white shadow-[var(--shadow-fun)] border-4 border-white/70"
          >
            🏆 Ranking
          </Link>
          <button
            type="button"
            onClick={shareApp}
            className="btn-pop inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-8 py-4 font-display text-xl font-bold text-white shadow-[var(--shadow-fun)] border-4 border-white/70"
          >
            📤 Bagikan
          </button>
        </div>

        <div
          className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-full border-4 border-white/70 px-6 py-3 text-sm font-semibold text-foreground/80"
          style={{ background: "oklch(1 0 0 / 0.75)", boxShadow: "var(--shadow-soft)" }}
        >
          <span>🧠 Melatih Fokus</span>
          <span className="hidden sm:inline text-muted-foreground">|</span>
          <span>📈 Meningkatkan Daya Ingat</span>
          <span className="hidden sm:inline text-muted-foreground">|</span>
          <span>⭐ Menuju Generasi Cerdas</span>
        </div>


      </div>
    </div>
  );
}
