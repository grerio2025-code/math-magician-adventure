// Server-only helper: writes a copy of ranking rows to the user's own Supabase project.
export interface MirrorRow {
  name: string;
  age: number;
  op: string;
  level: number;
  mode: string;
  score: number;
  total: number;
  seconds: number;
  created_at?: string;
}

export async function mirrorRows(rows: MirrorRow[]): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const url = process.env['MIRROR_SUPABASE_URL'];
  const key = process.env['MIRROR_SUPABASE_SERVICE_KEY'];
  if (!url || !key || rows.length === 0) return { ok: true, skipped: true };

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rankings`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(rows),
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn("[mirror] insert failed", res.status, text);
      return { ok: false, error: `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.warn("[mirror] insert threw", e);
    return { ok: false, error: "network" };
  }
}
