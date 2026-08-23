import { useEffect, useState } from "react"

import { LinkCard } from "@/components/link-card"
import {
  isFromSubjectNavigation,
  type QuestionNavTarget,
} from "@/lib/questions"

type NextQuestionNavProps = {
  examNext?: QuestionNavTarget
  subjectNext?: QuestionNavTarget
  examBackHref: string
  subjectBackHref: string
  subjectLabel: string
  year: number
}

export function NextQuestionNav({
  examNext,
  subjectNext,
  examBackHref,
  subjectBackHref,
  subjectLabel,
  year,
}: NextQuestionNavProps) {
  const [fromSubject, setFromSubject] = useState<boolean | null>(null)

  useEffect(() => {
    const sync = () => {
      setFromSubject(isFromSubjectNavigation(window.location.search))
    }

    sync()
    document.addEventListener("astro:page-load", sync)
    return () => document.removeEventListener("astro:page-load", sync)
  }, [])

  if (fromSubject === null) {
    return <div className="min-h-16" aria-hidden="true" />
  }

  const next = fromSubject ? subjectNext : examNext

  if (next) {
    return (
      <LinkCard
        href={next.href}
        label={`次の問題 · ${next.heading}`}
        title={next.stem}
      />
    )
  }

  return (
    <LinkCard
      href={fromSubject ? subjectBackHref : examBackHref}
      label={
        fromSubject
          ? `${subjectLabel}の最後の問題です`
          : `${year}年最後の問題です`
      }
      title="問題一覧に戻る"
    />
  )
}
