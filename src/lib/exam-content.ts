import { getCollection } from "astro:content"

import { compareQuestions, questionNavTarget } from "@/lib/questions"

export async function getPublishedQuestions() {
  return await getCollection("questions", ({ data }) => !data.draft)
}

export async function getQuestionsByTermId(termId: string) {
  return (await getPublishedQuestions())
    .filter((entry) => entry.data.terms.includes(termId))
    .sort((left, right) => compareQuestions(left.data, right.data))
    .map((entry) => questionNavTarget(entry.data))
}
