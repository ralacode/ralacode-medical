import { useEffect, useState } from "react"

import { LinkCard } from "@/components/link-card"
import { studyTopicLabel, type StudyTopicId } from "@/lib/exam-subjects"
import {
  browseCategoryHref,
  isFromSubjectNavigation,
  navigationTopic,
  type QuestionNavTarget,
} from "@/lib/questions"

type QuestionNavProps = {
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

function readNavigationState() {
  if (typeof window === "undefined") {
    return { fromSubject: false, topic: undefined as StudyTopicId | undefined }
  }
  const mode = document.documentElement.dataset.questionNavFrom
  const search = window.location.search
  if (mode === "subject") {
    return { fromSubject: true, topic: navigationTopic(search) }
  }
  if (mode === "exam") {
    return { fromSubject: false, topic: undefined }
  }
  return {
    fromSubject: isFromSubjectNavigation(search),
    topic: navigationTopic(search),
  }
}

export function QuestionNav({
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
  const [navState, setNavState] = useState(readNavigationState)

  useEffect(() => {
    const sync = () => {
      const fromSubject = isFromSubjectNavigation(window.location.search)
      const topic = navigationTopic(window.location.search)
      document.documentElement.dataset.questionNavFrom = fromSubject
        ? "subject"
        : "exam"
      if (topic) {
        document.documentElement.dataset.questionNavTopic = topic
      } else {
        delete document.documentElement.dataset.questionNavTopic
      }
      setNavState({ fromSubject, topic })
    }

    sync()
    document.addEventListener("astro:page-load", sync)
    return () => document.removeEventListener("astro:page-load", sync)
  }, [])

  const topicSequence = navState.topic ? topicNav?.[navState.topic] : undefined
  const fromTopic = navState.fromSubject && navState.topic != null

  const prev = fromTopic
    ? topicSequence?.prev
    : navState.fromSubject
      ? subjectPrev
      : examPrev
  const next = fromTopic
    ? topicSequence?.next
    : navState.fromSubject
      ? subjectNext
      : examNext

  const backHref = fromTopic
    ? browseCategoryHref(navState.topic!)
    : navState.fromSubject
      ? subjectBackHref
      : examBackHref
  const backLabel = fromTopic
    ? `${studyTopicLabel(navState.topic!)}の最後の問題です`
    : navState.fromSubject
      ? `${subjectLabel}の最後の問題です`
      : `${year}年最後の問題です`

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
        <LinkCard href={backHref} label={backLabel} title="問題一覧に戻る" />
      )}
    </nav>
  )
}
