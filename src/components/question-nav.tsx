import { useEffect, useState } from "react"

import { LinkCard } from "@/components/link-card"
import { SessionNav } from "@/components/session-nav"
import { useQuestionBrowseState } from "@/hooks/use-question-browse-state"
import { studyTopicLabel, type StudyTopicId } from "@/lib/exam-subjects"
import {
  browseCategoryHref,
  type QuestionNavTarget,
} from "@/lib/questions"
import { isActiveSessionQuestion } from "@/lib/study-session"

type QuestionNavProps = {
  questionId: string
  examPrev?: QuestionNavTarget
  examNext?: QuestionNavTarget
  subjectPrev?: QuestionNavTarget
  subjectNext?: QuestionNavTarget
  topicNav?: Partial<
    Record<StudyTopicId, { prev?: QuestionNavTarget; next?: QuestionNavTarget }>
  >
  examBackHref: string
  subjectBackHref: string
  subjectLabel: string
  year: number
}

export function QuestionNav({
  questionId,
  examPrev,
  examNext,
  subjectPrev,
  subjectNext,
  topicNav,
  examBackHref,
  subjectBackHref,
  subjectLabel,
  year,
}: QuestionNavProps) {
  const [inSession, setInSession] = useState<boolean | null>(null)

  useEffect(() => {
    const sync = () => {
      setInSession(isActiveSessionQuestion(questionId, window.location.search))
    }

    sync()
    document.addEventListener("astro:page-load", sync)
    return () => document.removeEventListener("astro:page-load", sync)
  }, [questionId])

  const { fromSubject, topic } = useQuestionBrowseState()

  if (inSession) return <SessionNav questionId={questionId} />
  if (inSession === null) {
    return <nav className="min-h-16" aria-hidden="true" />
  }
  const topicSequence = topic ? topicNav?.[topic] : undefined
  const fromTopic = fromSubject && topic != null

  const prev = fromTopic
    ? topicSequence?.prev
    : fromSubject
      ? subjectPrev
      : examPrev
  const next = fromTopic
    ? topicSequence?.next
    : fromSubject
      ? subjectNext
      : examNext

  const backHref = fromTopic
    ? browseCategoryHref(topic)
    : fromSubject
      ? subjectBackHref
      : examBackHref
  const backLabel = fromTopic
    ? `${studyTopicLabel(topic)}の最後の問題です`
    : fromSubject
      ? `${subjectLabel}の最後の問題です`
      : `${year}年最後の問題です`

  return (
    <nav className="grid gap-3" aria-label="問題ナビゲーション">
      {prev ? (
        <LinkCard
          key={prev.href}
          direction="back"
          href={prev.href}
          label={`前の問題 · ${prev.heading}`}
          title={prev.stem}
        />
      ) : null}
      {next ? (
        <LinkCard
          key={next.href}
          href={next.href}
          label={`次の問題 · ${next.heading}`}
          title={next.stem}
        />
      ) : (
        <LinkCard
          key={backHref}
          href={backHref}
          label={backLabel}
          title={
            fromTopic || fromSubject ? "問題一覧に戻る" : `${year}年一覧へ`
          }
        />
      )}
    </nav>
  )
}
