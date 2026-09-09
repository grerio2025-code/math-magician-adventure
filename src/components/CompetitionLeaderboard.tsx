import { flagOf } from "@/lib/countries";
import type { ParticipantRow } from "@/lib/competitions.functions";

const MEDAL = ["🥇", "🥈", "🥉"];

export function sortParticipants(list: ParticipantRow[]): ParticipantRow[] {
  return [...list].sort((a, b) => (b.score - a.score) || (a.seconds - b.seconds) || a.name.localeCompare(b.name));
}

export default function CompetitionLeaderboard({
  participants,
  highlightKey,
}: {
  participants: ParticipantRow[];
  highlightKey?: string | null;
}) {
  const rows = sortParticipants(participants);
  if (!rows.length) {
    return (
      <p className="rounded-2xl border-4 border-white/70 bg-white/70 px-4 py-6 text-center text-sm font-semibold text-muted-foreground">
        Belum ada peserta. Bagikan kode lomba ya! 🎈
      </p>
    );
  }
  return (
    <div className="grid gap-2">
      {rows.map((p, i) => {
        const mine = highlightKey && p.player_key === highlightKey;
        return (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-2xl border-4 px-3 py-2.5"
            style={{
              background: mine ? "color-mix(in oklab, var(--primary) 12%, white 88%)" : "oklch(1 0 0 / 0.85)",
              borderColor: mine ? "var(--primary)" : "oklch(1 0 0 / 0.8)",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-base font-bold"
              style={{ background: "color-mix(in oklab, var(--primary) 14%, white 86%)" }}
            >
              {MEDAL[i] ?? i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-lg font-bold leading-tight text-foreground">
                {flagOf(p.country_code)} {p.name}{" "}
                <span className="text-sm font-semibold text-muted-foreground">({p.age} th)</span>
              </span>
              <span className="block truncate text-xs text-muted-foreground">{p.school || "—"}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block font-display text-xl font-bold text-foreground">{p.score}</span>
              <span className="block text-[11px] text-muted-foreground">{p.seconds}s</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
