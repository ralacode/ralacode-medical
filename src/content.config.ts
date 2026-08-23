import { defineCollection } from "astro:content"
import { z } from "astro/zod"
import { glob } from "astro/loaders"

import type { FaqItem } from "./lib/article-seo"
import { examSubjectIds } from "./lib/exam-subjects"

const choiceNumber = z.number().int().min(1).max(5)
const examAnswer = z.union([choiceNumber, z.array(choiceNumber).min(1)])

// article-seo.ts の FaqItem と形がずれないように satisfies で固定する
const faqItem = z.object({
  question: z.string(),
  answer: z.string(),
}) satisfies z.ZodType<FaqItem>

const articles = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    faq: z.array(faqItem).default([]),
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
      /** 公式の正答。1-indexed。複数正解の問は配列 */
      answer: examAnswer,
    }),
    /** 令和6年4月施行の試験科目 */
    subject: z.enum(examSubjectIds),
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
    /** false のとき、肢番号に意味があるのでランダムにしない */
    shuffleChoices: z.boolean().default(true),
    /** 1-indexed。複数正解の問は配列 */
    answer: examAnswer,
    terms: z.array(z.string()).default([]),
    /** 対応する過去問の出題要点。公式の問題文・選択肢は含めない */
    sourceExplanation: z.string().optional(),
    draft: z.boolean().default(false),
  }),
})

export const collections = { articles, questions }
