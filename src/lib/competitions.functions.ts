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
  kind?: "speed" | "quiz";
  current_question?: number;
  question_started_at?: string | null;
  question_seconds?: number;
  hide_prompt?: boolean;
  auto_next?: boolean;
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
  "id, title, join_code, has_pin, start_at, ops, difficulty, difficulty_custom, input_type, duration_seconds, total_questions, status, question_seed, started_at, ended_at, host_name, created_at, kind, current_question, question_started_at, question_seconds, hide_prompt, auto_next";

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
    .select("id, started_at, duration_seconds, kind")
    .eq("status", "live");
  const now = Date.now();
  const stale = (data ?? []).filter(
    (c: any) => c.kind !== "quiz" &&
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
  await db.from("quiz_answers").delete().in("competition_id", ids);
  await db.from("quiz_questions").delete().in("competition_id", ids);
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
        missingNumber: z.boolean().optional().default(false),
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
        difficulty_custom:
          data.difficulty === "custom"
            ? { ...data.custom, missing: data.missingNumber }
            : data.missingNumber
              ? { missing: true }
              : null,
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

// ================= QUIZ LIVE =================

export interface QuizQuestionPublic {
  position: number;
  prompt: string;
  choices: string[] | null;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export const createQuiz = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().trim().min(1).max(120),
        usePin: z.boolean(),
        pin: z.string().regex(/^\d{4}$/).optional().nullable(),
        startAt: z.string().min(4),
        inputType: z.enum(["blind", "choices"]),
        questionSeconds: z.number().int().min(5).max(600),
        hostName: z.string().trim().max(40).optional().default(""),
        questions: z
          .array(
            z.object({
              prompt: z.string().trim().min(1).max(500),
              choices: z.array(z.string().trim().min(1).max(120)).max(4).optional().nullable(),
              answer: z.string().trim().min(1).max(120),
            }),
          )
          .min(1)
          .max(100),
        captchaAnswer: z.number().int(),
        captchaA: z.number().int().min(1).max(20),
        captchaB: z.number().int().min(1).max(20),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (data.captchaA + data.captchaB !== data.captchaAnswer)
      return { ok: false as const, error: "Jawaban captcha salah. Coba lagi ya!" };
    if (data.usePin && !data.pin) return { ok: false as const, error: "PIN 4 angka wajib diisi." };
    if (data.inputType === "choices") {
      for (const q of data.questions) {
        if (!q.choices || q.choices.length < 2 || !q.choices.includes(q.answer))
          return { ok: false as const, error: "Setiap soal butuh 2–4 pilihan dan satu jawaban benar." };
      }
    }
    const db = await admin();
    let code = makeJoinCode();
    for (let i = 0; i < 5; i++) {
      const { data: ex } = await db.from("competitions").select("id").eq("join_code", code).maybeSingle();
      if (!ex) break;
      code = makeJoinCode();
    }
    const { data: comp, error } = await db
      .from("competitions")
      .insert({
        title: data.title,
        join_code: code,
        has_pin: data.usePin,
        start_at: new Date(data.startAt).toISOString(),
        ops: ["+"],
        difficulty: "mudah",
        input_type: data.inputType,
        duration_seconds: 3600,
        total_questions: data.questions.length,
        status: "upcoming",
        question_seed: 0,
        host_name: data.hostName || null,
        kind: "quiz",
        question_seconds: data.questionSeconds,
      })
      .select(PUBLIC_COLS)
      .single();
    if (error || !comp) return { ok: false as const, error: "Gagal menyimpan quiz. Coba lagi." };
    const hostKey = randomKey();
    const mcKey = randomKey();
    await db.from("competition_secrets").insert({
      competition_id: comp.id,
      host_key: hostKey,
      mc_key: mcKey,
      pin: data.usePin ? data.pin : null,
    });
    await db.from("quiz_questions").insert(
      data.questions.map((q, i) => ({
        competition_id: comp.id,
        position: i,
        prompt: q.prompt,
        choices: data.inputType === "choices" ? q.choices : null,
        answer: q.answer,
      })),
    );
    return { ok: true as const, competition: comp as CompetitionRow, hostKey, mcKey };
  });

async function compByCode(db: any, code: string) {
  const { data } = await db.from("competitions").select(PUBLIC_COLS).eq("join_code", code.toUpperCase()).maybeSingle();
  return data as CompetitionRow | null;
}

export const getQuizState = createServerFn({ method: "GET" })
  .inputValidator((d: { code: string; playerKey?: string }) =>
    z.object({ code: z.string().min(3).max(12), playerKey: z.string().max(64).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const comp = await compByCode(db, data.code);
    if (!comp) return { competition: null, question: null as QuizQuestionPublic | null, answered: false };
    let question: QuizQuestionPublic | null = null;
    let answered = false;
    if (comp.status === "live" && (comp.current_question ?? -1) >= 0) {
      const { data: q } = await db
        .from("quiz_questions")
        .select("position, prompt, choices")
        .eq("competition_id", comp.id)
        .eq("position", comp.current_question)
        .maybeSingle();
      question = q ?? null;
      if (question && comp.hide_prompt) question = { ...question, prompt: "" };
      if (data.playerKey) {
        const { data: a } = await db
          .from("quiz_answers")
          .select("id")
          .eq("competition_id", comp.id)
          .eq("player_key", data.playerKey)
          .eq("position", comp.current_question)
          .maybeSingle();
        answered = !!a;
      }
    }
    return { competition: comp, question, answered };
  });

async function mcGuard(db: any, code: string, mcKey: string) {
  const comp = await compByCode(db, code);
  if (!comp) return null;
  const { data: s } = await db.from("competition_secrets").select("mc_key, host_key").eq("competition_id", comp.id).maybeSingle();
  if (!s || (s.mc_key !== mcKey && s.host_key !== mcKey)) return null;
  return comp;
}

const mcInput = (d: unknown) =>
  z.object({ code: z.string().min(3).max(12), mcKey: z.string().min(8).max(64) }).parse(d);

export const getMcState = createServerFn({ method: "POST" })
  .inputValidator(mcInput)
  .handler(async ({ data }) => {
    const db = await admin();
    const comp = await mcGuard(db, data.code, data.mcKey);
    if (!comp) return { ok: false as const };
    const { data: qs } = await db
      .from("quiz_questions")
      .select("position, prompt, choices, answer")
      .eq("competition_id", comp.id)
      .order("position");
    let answeredCount = 0;
    if ((comp.current_question ?? -1) >= 0) {
      const { count } = await db
        .from("quiz_answers")
        .select("id", { count: "exact", head: true })
        .eq("competition_id", comp.id)
        .eq("position", comp.current_question);
      answeredCount = count ?? 0;
    }
    const { data: parts } = await db
      .from("competition_participants")
      .select(PARTICIPANT_COLS)
      .eq("competition_id", comp.id);
    return {
      ok: true as const,
      competition: comp,
      questions: (qs ?? []) as { position: number; prompt: string; choices: string[] | null; answer: string }[],
      answeredCount,
      participants: (parts ?? []) as ParticipantRow[],
    };
  });

export const mcAdvance = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ code: z.string().min(3).max(12), mcKey: z.string().min(8).max(64), action: z.enum(["start", "next", "finish", "options"]), expectPos: z.number().int().optional(), hidePrompt: z.boolean().optional(), autoNext: z.boolean().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const comp = await mcGuard(db, data.code, data.mcKey);
    if (!comp) return { ok: false as const, error: "Tautan MC tidak valid." };
    const now = new Date().toISOString();
    if (data.action === "options") {
      const patch: Record<string, boolean> = {};
      if (data.hidePrompt !== undefined) patch.hide_prompt = data.hidePrompt;
      if (data.autoNext !== undefined) patch.auto_next = data.autoNext;
      await db.from("competitions").update(patch).eq("id", comp.id);
      return { ok: true as const };
    }
    if (data.action === "next" && data.expectPos !== undefined && data.expectPos !== comp.current_question)
      return { ok: true as const };
    if (data.action === "finish") {
      await db.from("competitions").update({ status: "completed", ended_at: now }).eq("id", comp.id);
      return { ok: true as const };
    }
    if (data.action === "start") {
      await db
        .from("competitions")
        .update({ status: "live", started_at: now, ended_at: null, current_question: 0, question_started_at: now })
        .eq("id", comp.id);
      return { ok: true as const };
    }
    const next = (comp.current_question ?? -1) + 1;
    if (next >= comp.total_questions) {
      await db.from("competitions").update({ status: "completed", ended_at: now }).eq("id", comp.id);
      return { ok: true as const };
    }
    await db.from("competitions").update({ current_question: next, question_started_at: now }).eq("id", comp.id);
    return { ok: true as const };
  });

export const submitQuizAnswer = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        code: z.string().min(3).max(12),
        playerKey: z.string().min(8).max(64),
        position: z.number().int().min(0).max(199),
        answer: z.string().max(120),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const comp = await compByCode(db, data.code);
    if (!comp || comp.status !== "live" || comp.current_question !== data.position)
      return { ok: false as const, error: "Soal ini sudah ditutup." };
    const startedMs = comp.question_started_at ? new Date(comp.question_started_at).getTime() : Date.now();
    const ms = Math.max(0, Date.now() - startedMs);
    if (ms > (comp.question_seconds ?? 20) * 1000 + 1500) return { ok: false as const, error: "Waktu soal habis." };
    const { data: part } = await db
      .from("competition_participants")
      .select("id, score, answered, seconds")
      .eq("competition_id", comp.id)
      .eq("player_key", data.playerKey)
      .maybeSingle();
    if (!part) return { ok: false as const, error: "Kamu belum terdaftar." };
    const { data: q } = await db
      .from("quiz_questions")
      .select("answer")
      .eq("competition_id", comp.id)
      .eq("position", data.position)
      .maybeSingle();
    if (!q) return { ok: false as const, error: "Soal tidak valid." };
    const correct = norm(q.answer) === norm(data.answer);
    const { error } = await db.from("quiz_answers").insert({
      competition_id: comp.id,
      player_key: data.playerKey,
      position: data.position,
      correct,
      ms,
    });
    if (error) return { ok: false as const, error: "Kamu sudah menjawab soal ini." };
    await db
      .from("competition_participants")
      .update({
        score: part.score + (correct ? 1 : 0),
        answered: part.answered + 1,
        seconds: part.seconds + Math.round(ms / 1000),
      })
      .eq("id", part.id);
    return { ok: true as const, correct };
  });

export const generateQuizQuestions = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      topic: z.string().trim().min(2).max(200),
      count: z.number().int().min(1).max(30),
      inputType: z.enum(["blind", "choices"]),
      level: z.enum(["beginner", "intermediate", "advance"]),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const geminiKey = process.env["GEMINI_API_KEY"];
    const lovableKey = process.env["LOVABLE_API_KEY"];
    if (!geminiKey && !lovableKey) return { ok: false as const, error: "Layanan AI belum tersedia." };
    const lvl = { beginner: "mudah (anak SD kelas awal)", intermediate: "menengah", advance: "sulit/lanjutan" }[data.level];
    const sys = data.inputType === "choices"
      ? "Setiap soal punya 4 pilihan jawaban singkat, tepat satu benar. 'answer' harus sama persis dengan salah satu 'choices'."
      : "Jawaban harus singkat (1-3 kata atau angka) agar mudah diketik. 'choices' kosong.";
    const questionSchema = {
      type: "object",
      properties: {
        prompt: { type: "string" },
        choices: { type: "array", items: { type: "string" } },
        answer: { type: "string" },
      },
      required: ["prompt", "answer"],
    };
    let rawQuestions: any[] | null = null;
    if (geminiKey) {
      // Gemini API langsung (kunci milik pengguna, mis. di Netlify).
      // Nama model dapat dipaksa lewat env GEMINI_MODEL; bila sebuah nama tidak
      // dikenali oleh akun Anda (balasan 404) nama berikutnya dicoba otomatis.
      const models = [
        process.env["GEMINI_MODEL"]?.trim(),
        "gemini-3.8-flash",
        "gemini-3.8",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
      ].filter((m, i, arr): m is string => !!m && arr.indexOf(m) === i);
      const geminiBody = JSON.stringify({
        systemInstruction: { parts: [{ text: `Kamu pembuat soal quiz berbahasa Indonesia untuk lomba anak. ${sys}` }] },
        contents: [{ role: "user", parts: [{ text: `Buat ${data.count} soal tentang "${data.topic}", tingkat kesulitan ${lvl}.` }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: { questions: { type: "array", items: questionSchema } },
            required: ["questions"],
          },
        },
      });
      let sawNotFound = false;
      let lastStatus = 0;
      for (const model of models) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey.trim() },
            body: geminiBody,
          },
        );
        if (res.ok) {
          try {
            const j: any = await res.json();
            rawQuestions = JSON.parse(j.candidates[0].content.parts[0].text).questions;
          } catch {
            return { ok: false as const, error: "Gagal membaca hasil AI. Coba lagi." };
          }
          break;
        }
        const txt = await res.text();
        console.error("Gemini error", model, res.status, txt.slice(0, 500));
        if (res.status === 429) return { ok: false as const, error: "Terlalu banyak permintaan / kuota Gemini habis, coba sebentar lagi." };
        if (res.status === 401 || res.status === 403)
          return { ok: false as const, error: "Kunci Gemini ditolak. Periksa GEMINI_API_KEY di Netlify." };
        if (res.status === 404 || /not found|unsupported|does not exist|invalid model/i.test(txt)) {
          sawNotFound = true;
          continue;
        }
        lastStatus = res.status;
        break;
      }
      if (rawQuestions === null) {
        if (sawNotFound)
          return {
            ok: false as const,
            error: "Model Gemini tidak dikenali. Isi GEMINI_MODEL di Netlify dengan nama model yang aktif di akun Anda.",
          };
        return { ok: false as const, error: `Gagal membuat soal (Gemini ${lastStatus || "unknown"}). Coba lagi.` };
      }
    } else {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: `Kamu pembuat soal quiz berbahasa Indonesia untuk lomba anak. ${sys}` },
            { role: "user", content: `Buat ${data.count} soal tentang "${data.topic}", tingkat kesulitan ${lvl}.` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "save_questions",
              parameters: {
                type: "object",
                properties: { questions: { type: "array", items: questionSchema } },
                required: ["questions"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "save_questions" } },
        }),
      });
      if (res.status === 429) return { ok: false as const, error: "Terlalu banyak permintaan, coba sebentar lagi." };
      if (res.status === 402) return { ok: false as const, error: "Kuota AI habis." };
      if (!res.ok) return { ok: false as const, error: "Gagal membuat soal. Coba lagi." };
      try {
        const j: any = await res.json();
        rawQuestions = JSON.parse(j.choices[0].message.tool_calls[0].function.arguments).questions;
      } catch {
        return { ok: false as const, error: "Gagal membaca hasil AI. Coba lagi." };
      }
    }
    const qs = (rawQuestions ?? [])
      .map((q) => ({
        prompt: String(q.prompt ?? "").slice(0, 500),
        answer: String(q.answer ?? "").slice(0, 200),
        choices: Array.isArray(q.choices) ? q.choices.map((c: any) => String(c).slice(0, 200)).slice(0, 4) : [],
      }))
      .filter((q) => q.prompt && q.answer)
      .slice(0, data.count);
    if (qs.length === 0) return { ok: false as const, error: "AI tidak menghasilkan soal. Coba lagi." };
    return { ok: true as const, questions: qs };
  });
