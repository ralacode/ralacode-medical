import { articleDisplayTitle, articlesHref } from "@/lib/article-paths"
import { withBase } from "@/lib/paths"

export type FaqItem = {
  question: string
  answer: string
}

type BuildArticleJsonLdOptions = {
  site: URL
  canonicalURL: string
  title: string
  description: string
  pubDate: Date
  updatedDate?: Date
  faq?: FaqItem[]
}

function stripMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
}

export function buildArticleJsonLd({
  site,
  canonicalURL,
  title,
  description,
  pubDate,
  updatedDate,
  faq = [],
}: BuildArticleJsonLdOptions) {
  const siteURL = new URL(withBase(), site).href
  const orgId = `${siteURL}#organization`
  const articlesURL = new URL(articlesHref(), site).href
  const modified = updatedDate ?? pubDate

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      "@id": `${canonicalURL}#article`,
      headline: title,
      description,
      datePublished: pubDate.toISOString(),
      dateModified: modified.toISOString(),
      author: { "@type": "Organization", "@id": orgId },
      publisher: { "@id": orgId },
      mainEntityOfPage: { "@type": "WebPage", "@id": canonicalURL },
      inLanguage: "ja",
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${canonicalURL}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "ホーム",
          item: siteURL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "用語解説",
          item: articlesURL,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: articleDisplayTitle(title),
          item: canonicalURL,
        },
      ],
    },
  ]

  if (faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${canonicalURL}#faq`,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: stripMarkdown(item.answer),
        },
      })),
    })
  }

  return graph
}
