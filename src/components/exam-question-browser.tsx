import { useMemo, useState } from "react"
import { ArrowRightIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { matchesSearchText } from "@/lib/search-text"

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

function matchesStem(stem: string, query: string) {
  return matchesSearchText(stem, query)
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
          items: section.items.filter((item) => matchesStem(item.stem, query)),
        }))
        .filter((section) => section.items.length > 0),
    [query, sections]
  )

  return (
    <div className="grid gap-8">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">
          キーワードで探す
        </span>
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="例: 脂肪"
          className="h-11"
          autoComplete="off"
          spellCheck={false}
        />
      </label>

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
                  <a
                    className="flex min-h-16 items-center gap-3 p-4 transition-colors hover:bg-muted/50 active:bg-muted"
                    href={item.href}
                  >
                    <span className="grid min-w-0 flex-1 gap-1">
                      <span className="text-sm text-muted-foreground">
                        {item.heading}
                        {item.analog ? " · 類似問題" : ""}
                      </span>
                      <span className="leading-snug font-medium">
                        {item.stem}
                      </span>
                    </span>
                    <ArrowRightIcon
                      className="size-6 shrink-0 text-foreground"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  </a>
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
