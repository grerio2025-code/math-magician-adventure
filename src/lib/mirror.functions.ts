import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const rowSchema = z.object({
  name: z.string().min(1).max(80),
  age: z.number().int().min(0).max(120),
  op: z.enum(["+", "-", "x", "/"]),
  level: z.number().int().min(1).max(4),
  mode: z.enum(["blind", "choices"]),
  score: z.number().int().min(0).max(1000),
  total: z.number().int().min(1).max(1000),
  seconds: z.number().int().min(0).max(100000),
});

export const mirrorRanking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => rowSchema.parse(data))
  .handler(async ({ data }) => {
    const { mirrorRows } = await import("./mirror.server");
    return mirrorRows([data]);
  });
