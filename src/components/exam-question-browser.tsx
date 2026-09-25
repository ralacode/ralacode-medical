import { useMemo, useState } from "react"

import { LinkCard } from "@/components/link-card"
import { SearchField } from "@/components/search-field"
import { StartStudySessionButton } from "@/components/start-study-session-button"
import { buttonVariants } from "@/components/ui/button"
import { choiceSearchSnippet, matchesSearchText } from "@/lib/search-text"
import { cn } from "@/lib/utils"

export type ExamQuestionBrowserItem = {
  id: string
  href: string
  heading: string
  stem: string
  analog?: boolean
  /** 科目名検索用（試験科目＋学習タグ） */
  searchLabels?: string[]
  /** 選択肢本文。問題文に無い用語でもヒットさせる */
  choiceTexts?: string[]
  categoryLinks?: { href: string; label: string }[]
}

export type ExamQuestionBrowserSection = {
  title: string
  items: ExamQuestionBrowserItem[]
  session?: {
    title: string
    returnHref: string
  }
}

function questionPrimaryText(item: ExamQuestionBrowserItem) {
  return [item.stem, item.heading, ...(item.searchLabels ?? [])]
    .filter(Boolean)
    .join("\n")
}

function questionChoiceText(item: ExamQuestionBrowserItem) {
  return (item.choiceTexts ?? []).filter(Boolean).join("\n")
}

function matchesExamQuestion(item: ExamQuestionBrowserItem, query: string) {
  return matchesSearchText(
    [questionPrimaryText(item), questionChoiceText(item)].join("\n"),
    query
  )
}

/** 問題文・見出し・科目だけでは足りず、選択肢がヒットに寄与したとき */
function matchedViaChoices(item: ExamQuestionBrowserItem, query: string) {
  return (
    Boolean(query.trim()) &&
    !matchesSearchText(questionPrimaryText(item), query)
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
          placeholder="例: 脂肪、コンプトン散乱"
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
        filtered.map((section) => {
          const source =
            sections.find((entry) => entry.title === section.title) ?? section
          const sessionItems = source.session
            ? source.items.map((item) => ({
                id: item.id,
                href: item.href,
                heading: item.heading,
                stem: item.stem,
              }))
            : []

          return (
            <section key={section.title} className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-medium text-muted-foreground">
                  {section.title}
                </h2>
                {source.session && sessionItems.length > 0 ? (
                  <StartStudySessionButton
                    title={source.session.title}
                    items={sessionItems}
                    returnHref={source.session.returnHref}
                  />
                ) : null}
              </div>
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
                      note={
                        matchedViaChoices(item, query)
                          ? choiceSearchSnippet(
                              item.choiceTexts ?? [],
                              query,
                              questionPrimaryText(item)
                            )
                          : undefined
                      }
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
          )
        })
      )}
    </div>
  )
}
