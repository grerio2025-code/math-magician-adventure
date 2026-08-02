import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/mirror-backfill")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env['MIRROR_BACKFILL_TOKEN'];
        const provided = request.headers.get("x-backfill-token") ?? "";
        if (!token || provided !== token) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("rankings")
          .select("name, age, op, level, mode, score, total, seconds, created_at")
          .order("created_at", { ascending: true })
          .limit(5000);

        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

        const { mirrorRows } = await import("@/lib/mirror.server");
        const rows = (data ?? []).map((r) => ({
          name: r.name,
          age: r.age,
          op: r.op,
          level: r.level,
          mode: r.mode,
          score: r.score,
          total: r.total,
          seconds: r.seconds,
          created_at: r.created_at as string,
        }));
        const result = await mirrorRows(rows);
        return Response.json({ ...result, count: rows.length });
      },
    },
  },
});
