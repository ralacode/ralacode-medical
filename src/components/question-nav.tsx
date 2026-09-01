import { LinkCard } from "@/components/link-card"
import { useQuestionBrowseState } from "@/hooks/use-question-browse-state"
import { studyTopicLabel, type StudyTopicId } from "@/lib/exam-subjects"
import {
  browseCategoryHref,
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
  const { fromSubject, topic } = useQuestionBrowseState()
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
          title="問題一覧に戻る"
        />
      )}
    </nav>
  )
}
