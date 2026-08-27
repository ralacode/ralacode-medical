import { useEffect, useState } from "react"

import { LinkCard } from "@/components/link-card"
import {
  isFromSubjectNavigation,
  type QuestionNavTarget,
} from "@/lib/questions"

type QuestionNavProps = {
  examPrev?: QuestionNavTarget
  examNext?: QuestionNavTarget
  subjectPrev?: QuestionNavTarget
  subjectNext?: QuestionNavTarget
  examBackHref: string
  subjectBackHref: string
  subjectLabel: string
  year: number
}

function readFromSubjectNavigation() {
  if (typeof window === "undefined") return false
  const mode = document.documentElement.dataset.questionNavFrom
  if (mode === "subject") return true
  if (mode === "exam") return false
  return isFromSubjectNavigation(window.location.search)
}

export function QuestionNav({
  examPrev,
  examNext,
  subjectPrev,
  subjectNext,
  examBackHref,
  subjectBackHref,
  subjectLabel,
  year,
}: QuestionNavProps) {
  const [fromSubject, setFromSubject] = useState(readFromSubjectNavigation)

  useEffect(() => {
    const sync = () => {
      const from = isFromSubjectNavigation(window.location.search)
      document.documentElement.dataset.questionNavFrom = from ? "subject" : "exam"
      setFromSubject(from)
    }

    sync()
    document.addEventListener("astro:page-load", sync)
    return () => document.removeEventListener("astro:page-load", sync)
  }, [])

  const prev = fromSubject ? subjectPrev : examPrev
  const next = fromSubject ? subjectNext : examNext

  return (
    <nav className="grid gap-3" aria-label="問題ナビゲーション">
      {prev ? (
        <LinkCard
          direction="back"
          href={prev.href}
          label={`前の問題 · ${prev.heading}`}
          title={prev.stem}
        />
      ) : null}
      {next ? (
        <LinkCard
          href={next.href}
          label={`次の問題 · ${next.heading}`}
          title={next.stem}
        />
      ) : (
        <LinkCard
          href={fromSubject ? subjectBackHref : examBackHref}
          label={
            fromSubject
              ? `${subjectLabel}の最後の問題です`
              : `${year}年最後の問題です`
          }
          title="問題一覧に戻る"
        />
      )}
    </nav>
  )
}
