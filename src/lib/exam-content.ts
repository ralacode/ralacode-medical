import { getCollection } from "astro:content"

export async function getPublishedQuestions() {
  return await getCollection("questions", ({ data }) => !data.draft)
}
