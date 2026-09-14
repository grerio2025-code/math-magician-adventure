import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  generateCompetitionQuestions,
  type CompDifficulty,
  type CompOp,
} from "@/lib/competition-questions";

export interface CompetitionRow {
  id: string;
  title: string;
  join_code: string;
  has_pin: boolean;
  start_at: string;
  ops: string[];
  difficulty: CompDifficulty;
  difficulty_custom: { min?: number; max?: number; missing?: boolean } | null;
  input_type: "blind" | "choices";
  duration_seconds: number;
  total_questions: number;
  status: "upcoming" | "live" | "completed";
  question_seed: number;
  started_at: string | null;
  ended_at: string | null;
  host_name: string | null;
  created_at: string;
}

export interface ParticipantRow {
  id: string;
  competition_id: string;
  player_key: string;
  name: string;
  age: number;
  school: string | null;
  country_code: string;
  score: number;
  answered: number;
  seconds: number;
  finished_at: string | null;
}

const PUBLIC_COLS =
  "id, title, join_code, has_pin, start_at, ops, difficulty, difficulty_custom, input_type, duration_seconds, total_questions, status, question_seed, started_at, ended_at, host_name, created_at";

const PARTICIPANT_COLS =
  "id, competition_id, player_key, name, age, school, country_code, score, answered, seconds, finished_at";

const opsSchema = z.array(z.enum(["+", "-", "x", "/"])).min(1).max(4);

const profileSchema = z.object({
  playerKey: z.string().min(8).max(64),
  name: z.string().trim().min(1).max(40),
  age: z.number().int().min(1).max(120),
  school: z.string().trim().max(120).optional().default(""),
  countryCode: z.string().trim().length(2),
});

function makeJoinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function randomKey() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

/** Close competitions whose timer already elapsed. */
async function autoComplete(db: any) {
  const { data } = await db
    .from("competitions")
    .select("id, started_at, duration_seconds")
    .eq("status", "live");
  const now = Date.now();
  const stale = (data ?? []).filter(
    (c: any) =>
      c.started_at && new Date(c.started_at).getTime() + c.duration_seconds * 1000 <= now,
  );
  for (const c of stale) {
    await db
      .from("competitions")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", c.id);
  }
}

async function purge(db: any, ids: string[]) {
  if (!ids.length) return;
  await db.from("competition_participants").delete().in("competition_id", ids);
  await db.from("competition_secrets").delete().in("competition_id", ids);
  await db.from("competitions").delete().in("id", ids);
}

/**
 * Housekeeping:
 * - active (upcoming/live) competitions older than 2 days after start_at are removed
 * - completed competitions with no participants are removed
 * - keep only the 50 newest completed competitions (FIFO: oldest removed first)
 */
async function cleanup(db: any) {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const { data: staleActive } = await db
    .from("competitions")
    .select("id")
    .in("status", ["upcoming", "live"])
    .lt("start_at", twoDaysAgo);
  await purge(db, (staleActive ?? []).map((c: any) => c.id));

  const { data: done } = await db
    .from("competitions")
    .select("id")
    .eq("status", "completed")
    .order("start_at", { ascending: false });
  const completed = (done ?? []).map((c: any) => c.id as string);
  if (!completed.length) return;

  const { data: parts } = await db
    .from("competition_participants")
    .select("competition_id")
    .in("competition_id", completed);
  const counts: Record<string, number> = {};
  for (const p of parts ?? []) counts[p.competition_id] = (counts[p.competition_id] ?? 0) + 1;

  const empty = completed.filter((id: string) => !counts[id]);
  const kept = completed.filter((id: string) => !!counts[id]);

  const overflow = kept.slice(50); // newest first → everything past 50 is oldest
  await purge(db, [...empty, ...overflow]);
}

export const listCompetitions = createServerFn({ method: "GET" }).handler(async () => {
  const db = await admin();
  await autoComplete(db);
  await cleanup(db);

  const { data, error } = await db
    .from("competitions")
    .select(PUBLIC_COLS)
    .order("start_at", { ascending: false })
    .limit(150);
  if (error) return { competitions: [] as CompetitionRow[], counts: {} as Record<string, number> };
  const rows = (data ?? []) as CompetitionRow[];
  const { data: parts } = await db
    .from("competition_participants")
    .select("competition_id");
  const counts: Record<string, number> = {};
  for (const p of parts ?? []) counts[p.competition_id] = (counts[p.competition_id] ?? 0) + 1;
  return { competitions: rows, counts };
});

export const getCompetition = createServerFn({ method: "GET" })
  .inputValidator((d: { code: string }) => z.object({ code: z.string().min(3).max(12) }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    await autoComplete(db);
    const { data: comp } = await db
      .from("competitions")
      .select(PUBLIC_COLS)
      .eq("join_code", data.code.toUpperCase())
      .maybeSingle();
    if (!comp) return { competition: null, participants: [] as ParticipantRow[] };
    const { data: parts } = await db
      .from("competition_participants")
      .select(PARTICIPANT_COLS)
      .eq("competition_id", comp.id)
      .order("score", { ascending: false })
      .order("seconds", { ascending: true });
    return {
      competition: comp as CompetitionRow,
      participants: (parts ?? []) as ParticipantRow[],
    };
  });

export const createCompetition = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().trim().min(1).max(120),
        usePin: z.boolean(),
        pin: z.string().regex(/^\d{4}$/).optional().nullable(),
        startAt: z.string().min(4),
        ops: opsSchema,
        difficulty: z.enum(["mudah", "sedang", "sulit", "custom"]),
        custom: z.object({ min: z.number().int().min(0).max(100000), max: z.number().int().min(1).max(100000) }).nullable().optional(),
        inputType: z.enum(["blind", "choices"]),
        durationSeconds: z.number().int().min(15).max(3600),
        totalQuestions: z.number().int().min(5).max(200),
        hostName: z.string().trim().max(40).optional().default(""),
        captchaAnswer: z.number().int(),
        captchaA: z.number().int().min(1).max(20),
        captchaB: z.number().int().min(1).max(20),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (data.captchaA + data.captchaB !== data.captchaAnswer) {
      return { ok: false as const, error: "Jawaban captcha salah. Coba lagi ya!" };
    }
    if (data.usePin && !data.pin) {
      return { ok: false as const, error: "PIN 4 angka wajib diisi." };
    }
    if (data.difficulty === "custom" && !data.custom) {
      return { ok: false as const, error: "Rentang angka khusus wajib diisi." };
    }
    const db = await admin();
    const hostKey = randomKey();
    let code = makeJoinCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: exists } = await db
        .from("competitions")
        .select("id")
        .eq("join_code", code)
        .maybeSingle();
      if (!exists) break;
      code = makeJoinCode();
    }
    const { data: comp, error } = await db
      .from("competitions")
      .insert({
        title: data.title,
        join_code: code,
        has_pin: data.usePin,
        start_at: new Date(data.startAt).toISOString(),
        ops: data.ops,
        difficulty: data.difficulty,
        difficulty_custom: data.difficulty === "custom" ? data.custom : null,
        input_type: data.inputType,
        duration_seconds: data.durationSeconds,
        total_questions: data.totalQuestions,
        status: "upcoming",
        question_seed: Math.floor(Math.random() * 2147483647),
        host_name: data.hostName || null,
      })
      .select(PUBLIC_COLS)
      .single();
    if (error || !comp) {
      return { ok: false as const, error: "Gagal menyimpan kompetisi. Coba lagi." };
    }
    await db.from("competition_secrets").insert({
      competition_id: comp.id,
      host_key: hostKey,
      pin: data.usePin ? data.pin : null,
    });
    return { ok: true as const, competition: comp as CompetitionRow, hostKey };
  });

export const joinCompetition = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        code: z.string().min(3).max(12),
        pin: z.string().max(8).optional().nullable(),
        profile: profileSchema,
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: comp } = await db
      .from("competitions")
      .select("id, has_pin, status")
      .eq("join_code", data.code.toUpperCase())
      .maybeSingle();
    if (!comp) return { ok: false as const, error: "Kompetisi tidak ditemukan." };
    if (comp.status === "completed") return { ok: false as const, error: "Kompetisi sudah selesai." };
    if (comp.has_pin) {
      const { data: secret } = await db
        .from("competition_secrets")
        .select("pin")
        .eq("competition_id", comp.id)
        .maybeSingle();
      if (!secret || secret.pin !== (data.pin ?? "")) {
        return { ok: false as const, error: "PIN salah." };
      }
    }
    const p = data.profile;
    await db.from("players").upsert(
      {
        player_key: p.playerKey,
        name: p.name,
        age: p.age,
        school: p.school || null,
        country_code: p.countryCode.toUpperCase(),
      },
      { onConflict: "player_key" },
    );
    const { error } = await db.from("competition_participants").upsert(
      {
        competition_id: comp.id,
        player_key: p.playerKey,
        name: p.name,
        age: p.age,
        school: p.school || null,
        country_code: p.countryCode.toUpperCase(),
      },
      { onConflict: "competition_id,player_key" },
    );
    if (error) return { ok: false as const, error: "Gagal mendaftar. Coba lagi." };
    return { ok: true as const };
  });

async function hostGuard(db: any, code: string, hostKey: string) {
  const { data: comp } = await db
    .from("competitions")
    .select("id, status, duration_seconds")
    .eq("join_code", code.toUpperCase())
    .maybeSingle();
  if (!comp) return { comp: null, ok: false };
  const { data: secret } = await db
    .from("competition_secrets")
    .select("host_key")
    .eq("competition_id", comp.id)
    .maybeSingle();
  return { comp, ok: !!secret && secret.host_key === hostKey };
}

const hostInput = (d: unknown) =>
  z.object({ code: z.string().min(3).max(12), hostKey: z.string().min(8).max(64) }).parse(d);

export const startCompetition = createServerFn({ method: "POST" })
  .inputValidator(hostInput)
  .handler(async ({ data }) => {
    const db = await admin();
    const { comp, ok } = await hostGuard(db, data.code, data.hostKey);
    if (!comp || !ok) return { ok: false as const, error: "Kamu bukan host kompetisi ini." };
    await db
      .from("competitions")
      .update({ status: "live", started_at: new Date().toISOString(), ended_at: null })
      .eq("id", comp.id);
    return { ok: true as const };
  });

export const stopCompetition = createServerFn({ method: "POST" })
  .inputValidator(hostInput)
  .handler(async ({ data }) => {
    const db = await admin();
    const { comp, ok } = await hostGuard(db, data.code, data.hostKey);
    if (!comp || !ok) return { ok: false as const, error: "Kamu bukan host kompetisi ini." };
    await db
      .from("competitions")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", comp.id);
    return { ok: true as const };
  });

export const submitAnswer = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        code: z.string().min(3).max(12),
        playerKey: z.string().min(8).max(64),
        questionIndex: z.number().int().min(0).max(199),
        answer: z.number().int(),
        seconds: z.number().int().min(0).max(100000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: comp } = await db
      .from("competitions")
      .select(PUBLIC_COLS)
      .eq("join_code", data.code.toUpperCase())
      .maybeSingle();
    if (!comp) return { ok: false as const, correct: false, error: "Kompetisi tidak ditemukan." };
    if (comp.status !== "live") {
      return { ok: false as const, correct: false, error: "Kompetisi belum/tidak berjalan." };
    }
    if (
      comp.started_at &&
      new Date(comp.started_at).getTime() + comp.duration_seconds * 1000 < Date.now()
    ) {
      await db
        .from("competitions")
        .update({ status: "completed", ended_at: new Date().toISOString() })
        .eq("id", comp.id);
      return { ok: false as const, correct: false, error: "Waktu sudah habis." };
    }
    const questions = generateCompetitionQuestions({
      ops: comp.ops as CompOp[],
      difficulty: comp.difficulty as CompDifficulty,
      custom: comp.difficulty_custom,
      inputType: comp.input_type,
      total: comp.total_questions,
      seed: Number(comp.question_seed),
    });
    const q = questions[data.questionIndex];
    if (!q) return { ok: false as const, correct: false, error: "Soal tidak valid." };
    const correct = q.answer === data.answer;

    const { data: part } = await db
      .from("competition_participants")
      .select("id, score, answered")
      .eq("competition_id", comp.id)
      .eq("player_key", data.playerKey)
      .maybeSingle();
    if (!part) return { ok: false as const, correct, error: "Kamu belum terdaftar." };
    // Wrong answers add 0 points — never negative.
    if (data.questionIndex + 1 > part.answered) {
      await db
        .from("competition_participants")
        .update({
          score: part.score + (correct ? 1 : 0),
          answered: data.questionIndex + 1,
          seconds: data.seconds,
        })
        .eq("id", part.id);
    }
    return { ok: true as const, correct };
  });

export const finishParticipant = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        code: z.string().min(3).max(12),
        playerKey: z.string().min(8).max(64),
        seconds: z.number().int().min(0).max(100000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: comp } = await db
      .from("competitions")
      .select("id")
      .eq("join_code", data.code.toUpperCase())
      .maybeSingle();
    if (!comp) return { ok: false as const };
    await db
      .from("competition_participants")
      .update({ finished_at: new Date().toISOString(), seconds: data.seconds })
      .eq("competition_id", comp.id)
      .eq("player_key", data.playerKey);
    return { ok: true as const };
  });
