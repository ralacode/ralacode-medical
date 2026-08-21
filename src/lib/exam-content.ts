import { getCollection } from "astro:content"

import {
  compareQuestions,
  questionHeading,
  questionHref,
} from "@/lib/questions"

export async function getPublishedQuestions() {
  return await getCollection("questions", ({ data }) => !data.draft)
}

export async function getQuestionsByTermId(termId: string) {
  const questions = (await getPublishedQuestions())
    .filter((entry) => entry.data.terms.includes(termId))
    .map((entry) => ({
      href: questionHref(
        entry.data.year,
        entry.data.session,
        entry.data.number
      ),
      heading: questionHeading(
        entry.data.exam,
        entry.data.session,
        entry.data.number
      ),
      stem: entry.data.stem,
      year: entry.data.year,
      session: entry.data.session,
      number: entry.data.number,
    }))

  return questions.sort(compareQuestions)
}
