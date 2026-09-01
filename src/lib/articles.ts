import { getCollection, type CollectionEntry } from "astro:content"

import { articleHref, articleDisplayTitle } from "@/lib/article-paths"

export type ArticleEntry = CollectionEntry<"articles">

export async function getPublishedArticles(): Promise<ArticleEntry[]> {
  try {
    return await getCollection("articles", ({ data }) => !data.draft)
  } catch {
    return []
  }
}

export async function getArticlesByTermIds(termIds: string[]) {
  if (termIds.length === 0) return []

  const articles = await getPublishedArticles()
  const byId = new Map(articles.map((article) => [article.id, article]))

  return termIds.flatMap((termId) => {
    const article = byId.get(termId)
    return article
      ? [
          {
            termId,
            title:
              article.data.termLabel?.trim() ||
              articleDisplayTitle(article.data.title),
            href: articleHref(article.id),
          },
        ]
      : []
  })
}
