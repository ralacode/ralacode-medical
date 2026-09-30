import { getCollection } from "astro:content"

import { canRevealExamYear } from "@/lib/exam-visibility"
import { compareQuestions, questionNavTarget } from "@/lib/questions"

/** draft でない問。年次ページの静的パス用。本番の一覧は getPublishedQuestions。 */
export async function getCatalogQuestions() {
  return await getCollection("questions", ({ data }) => !data.draft)
}

export async function getPublishedQuestions() {
  return (await getCatalogQuestions()).filter((entry) =>
    canRevealExamYear(entry.data.year)
  )
}

export async function getQuestionsByTermId(termId: string) {
  return (await getPublishedQuestions())
    .filter((entry) => entry.data.terms.includes(termId))
    .sort((left, right) => compareQuestions(left.data, right.data))
    .map((entry) => questionNavTarget(entry.data))
}
