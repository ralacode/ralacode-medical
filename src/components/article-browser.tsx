import { useMemo, useState } from "react"
import { ArrowRightIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
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
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            キーワードで探す
          </span>
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="例: k空間"
            className="h-11"
            autoComplete="off"
            spellCheck={false}
          />
        </label>

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
              <a
                className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50 active:bg-muted"
                href={item.href}
              >
                <span className="grid min-w-0 flex-1 gap-1">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.description}
                  </span>
                </span>
                <ArrowRightIcon
                  className="size-6 shrink-0 text-foreground"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
