import { useMemo, useState } from "react"

import { LinkCard } from "@/components/link-card"
import { SearchField } from "@/components/search-field"
import { buttonVariants } from "@/components/ui/button"
import { matchesSearchText } from "@/lib/search-text"
import { cn } from "@/lib/utils"

export type ExamQuestionBrowserItem = {
  href: string
  heading: string
  stem: string
  analog?: boolean
  /** 科目名検索用（試験科目＋学習タグ） */
  searchLabels?: string[]
  categoryLinks?: { href: string; label: string }[]
}

export type ExamQuestionBrowserSection = {
  title: string
  items: ExamQuestionBrowserItem[]
}

function matchesExamQuestion(item: ExamQuestionBrowserItem, query: string) {
  return matchesSearchText(
    [item.stem, item.heading, ...(item.searchLabels ?? [])]
      .filter(Boolean)
      .join("\n"),
    query
  )
}

export function ExamQuestionBrowser({
  sections,
}: {
  sections: ExamQuestionBrowserSection[]
}) {
  const [query, setQuery] = useState("")
  const trimmedQuery = query.trim()

  const { filtered, resultCount } = useMemo(() => {
    const next = sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => matchesExamQuestion(item, query)),
      }))
      .filter((section) => section.items.length > 0)

    return {
      filtered: next,
      resultCount: next.reduce((sum, section) => sum + section.items.length, 0),
    }
  }, [query, sections])

  return (
    <div className="grid gap-8">
      <div className="grid gap-3">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="例: 脂肪、放射線生物学"
        />

        {trimmedQuery && resultCount > 0 ? (
          <p
            className="text-sm text-muted-foreground"
            aria-live="polite"
            aria-atomic="true"
          >
            {resultCount}件見つかりました
          </p>
        ) : null}
      </div>

      {trimmedQuery && resultCount === 0 ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          該当する問はありません。
        </p>
      ) : (
        filtered.map((section) => (
          <section key={section.title} className="grid gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              {section.title}
            </h2>
            <ul className="grid gap-3">
              {section.items.map((item) => (
                <li
                  key={item.href}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <LinkCard
                    bare
                    href={item.href}
                    label={`${item.heading}${item.analog ? " · 類似問題" : ""}`}
                    title={item.stem}
                  />
                  {item.categoryLinks && item.categoryLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-2 border-t border-border p-3">
                      {item.categoryLinks.map((link) => (
                        <a
                          key={link.href}
                          className={cn(
                            buttonVariants({ variant: "default" }),
                            "min-h-11"
                          )}
                          href={link.href}
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
