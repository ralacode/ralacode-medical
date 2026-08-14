import { defineCollection } from "astro:content"
import { z } from "astro/zod"
import { glob } from "astro/loaders"

const articles = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
})

const questions = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/questions" }),
  schema: z.object({
    year: z.number().int(),
    exam: z.number().int(),
    session: z.enum(["am", "pm"]),
    number: z.number().int().positive(),
    /** 公式文の転載ではなく、出題意図に沿ったオリジナル問題 */
    origin: z.literal("analog"),
    mapsTo: z.object({
      year: z.number().int(),
      exam: z.number().int(),
      session: z.enum(["am", "pm"]),
      number: z.number().int().positive(),
    }),
    subject: z.string().optional(),
    stem: z.string(),
    /** 選択肢。text が本文、explanation が回答後に直下へ出す Markdown */
    choices: z
      .array(
        z.object({
          text: z.string(),
          explanation: z.string().default(""),
        })
      )
      .length(5),
    /** 1-indexed。複数正解の問は配列 */
    answer: z.union([
      z.number().int().min(1).max(5),
      z.array(z.number().int().min(1).max(5)).min(1),
    ]),
    terms: z.array(z.string()).default([]),
    /** 対応する過去問の出題要点。公式の問題文・選択肢は含めない */
    sourceExplanation: z.string().optional(),
    draft: z.boolean().default(false),
  }),
})

export const collections = { articles, questions }
