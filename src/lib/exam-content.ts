import { getCollection, type CollectionEntry } from "astro:content"

export async function getPublishedQuestions() {
  try {
    return await getCollection("questions", ({ data }) => !data.draft)
  } catch {
    return [] as CollectionEntry<"questions">[]
  }
}
