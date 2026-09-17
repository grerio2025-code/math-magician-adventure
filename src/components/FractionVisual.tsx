type Props = {
  totalParts: number;
  shadedParts: number;
  visualType: "pie" | "bar";
  size?: number;
  /** callback untuk mode lab: potongan bisa ditekan */
  onSliceClick?: (index: number) => void;
  /** daftar indeks potongan terpilih (mode lab) */
  selected?: number[];
};

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function slicePath(cx: number, cy: number, r: number, from: number, to: number) {
  const [x1, y1] = polarToXY(cx, cy, r, from);
  const [x2, y2] = polarToXY(cx, cy, r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

export function FractionVisual({
  totalParts,
  shadedParts,
  visualType,
  size = 180,
  onSliceClick,
  selected,
}: Props) {
  const isShaded = (i: number) =>
    selected ? selected.includes(i) : i < shadedParts;

  if (visualType === "pie") {
    const cx = 100;
    const cy = 100;
    const r = 92;
    const step = 360 / totalParts;
    return (
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        role="img"
        aria-label={`Gambar pecahan ${shadedParts} dari ${totalParts}`}
        className="max-w-full drop-shadow-sm"
      >
        <circle cx={cx} cy={cy} r={r + 4} fill="oklch(1 0 0 / 0.9)" />
        {Array.from({ length: totalParts }, (_, i) => (
          <path
            key={i}
            d={slicePath(cx, cy, r, i * step, (i + 1) * step)}
            fill={isShaded(i) ? "var(--op-fraction)" : "oklch(0.97 0.02 90)"}
            stroke="oklch(1 0 0)"
            strokeWidth={3}
            onClick={onSliceClick ? () => onSliceClick(i) : undefined}
            style={onSliceClick ? { cursor: "pointer" } : undefined}
          />
        ))}
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 240 80"
      width={size + 40}
      height={(size + 40) / 3}
      role="img"
      aria-label={`Gambar pecahan ${shadedParts} dari ${totalParts}`}
      className="max-w-full drop-shadow-sm"
    >
      <rect x={0} y={0} width={240} height={80} rx={12} fill="oklch(1 0 0 / 0.9)" />
      {Array.from({ length: totalParts }, (_, i) => {
        const w = 240 / totalParts;
        return (
          <rect
            key={i}
            x={i * w}
            y={0}
            width={w}
            height={80}
            rx={6}
            fill={isShaded(i) ? "var(--op-fraction)" : "oklch(0.97 0.02 90)"}
            stroke="oklch(1 0 0)"
            strokeWidth={3}
            onClick={onSliceClick ? () => onSliceClick(i) : undefined}
            style={onSliceClick ? { cursor: "pointer" } : undefined}
          />
        );
      })}
    </svg>
  );
}

export function FractionText({ n, d }: { n: number; d: number }) {
  return (
    <span className="inline-flex flex-col items-center leading-none font-display font-bold">
      <span>{n}</span>
      <span className="my-0.5 h-0.5 w-6 rounded-full bg-foreground/70" />
      <span>{d}</span>
    </span>
  );
}
