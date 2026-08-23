import { useMemo, useState } from "react"

import { LinkCard } from "@/components/link-card"
import { SearchField } from "@/components/search-field"
import { matchesSearchText } from "@/lib/search-text"

export type ArticleBrowserItem = {
  href: string
  title: string
  description: string
  keywords: string
}

function matchesArticle(item: ArticleBrowserItem, query: string) {
  return matchesSearchText(
    `${item.title}\n${item.description}\n${item.keywords}`,
    query
  )
}

export function ArticleBrowser({ items }: { items: ArticleBrowserItem[] }) {
  const [query, setQuery] = useState("")
  const trimmedQuery = query.trim()

  const filtered = useMemo(
    () => items.filter((item) => matchesArticle(item, query)),
    [items, query]
  )

  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <SearchField value={query} onChange={setQuery} placeholder="例: k空間" />

        {trimmedQuery && filtered.length > 0 ? (
          <p
            className="text-sm text-muted-foreground"
            aria-live="polite"
            aria-atomic="true"
          >
            {filtered.length}件の記事が見つかりました
          </p>
        ) : null}
      </div>

      {trimmedQuery && filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          該当する記事はありません。
        </p>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((item) => (
            <li key={item.href}>
              <LinkCard
                href={item.href}
                title={item.title}
                description={item.description}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
