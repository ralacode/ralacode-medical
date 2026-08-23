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
  subjectHref?: string
  subjectLabel?: string
}

export type ExamQuestionBrowserSection = {
  title: string
  items: ExamQuestionBrowserItem[]
}

export function ExamQuestionBrowser({
  sections,
}: {
  sections: ExamQuestionBrowserSection[]
}) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) =>
            matchesSearchText(item.stem, query)
          ),
        }))
        .filter((section) => section.items.length > 0),
    [query, sections]
  )

  return (
    <div className="grid gap-8">
      <SearchField value={query} onChange={setQuery} placeholder="例: 脂肪" />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          該当する問題はありません。
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
                  {item.subjectHref && item.subjectLabel ? (
                    <div className="border-t border-border p-3">
                      <a
                        className={cn(
                          buttonVariants({ variant: "default" }),
                          "min-h-11 w-full sm:w-auto"
                        )}
                        href={item.subjectHref}
                      >
                        {item.subjectLabel}
                      </a>
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
