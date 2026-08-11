import rss from "@astrojs/rss"
import type { APIRoute } from "astro"
import { getCollection, type CollectionEntry } from "astro:content"

import { siteMeta } from "@/lib/constants"
import { withBase } from "@/lib/paths"

async function getPublishedArticles(): Promise<CollectionEntry<"articles">[]> {
  try {
    return await getCollection("articles", ({ data }) => !data.draft)
  } catch {
    // 記事がまだ無いときは空フィードを返す
    return []
  }
}

export const GET: APIRoute = async (context) => {
  if (!context.site) {
    return new Response("Set `site` in astro.config.mjs.", { status: 500 })
  }

  const articles = await getPublishedArticles()

  return rss({
    title: siteMeta.siteTitle,
    description: siteMeta.siteDesc,
    site: new URL(withBase(), context.site),
    customData: `<language>ja</language>`,
    items: articles
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((article) => ({
        title: article.data.title,
        description: article.data.description,
        pubDate: article.data.pubDate,
        link: withBase(`articles/${article.id}/`),
      })),
  })
}
