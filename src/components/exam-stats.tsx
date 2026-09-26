import { useEffect, useMemo, useState, type ReactNode } from "react"

import { LinkCard } from "@/components/link-card"
import {
  examSubjectIds,
  studyTopicIds,
  subjectLabel,
  studyTopicLabel,
  type ExamSubjectId,
  type StudyTopicId,
} from "@/lib/exam-subjects"
import { browseCategoryHref, examsHref } from "@/lib/questions"
import {
  ACCURACY_SAMPLE_MIN,
  hasAnyAttempts,
  loadStudyRecord,
  summarizeCategory,
  type CategoryAccuracy,
  type StudyRecordV1,
} from "@/lib/study-record"

export type StatsQuestionMeta = {
  id: string
  subject: ExamSubjectId
  studyTopics?: StudyTopicId[]
}

type ExamStatsProps = {
  questions: StatsQuestionMeta[]
}

export function ExamStats({ questions }: ExamStatsProps) {
  const [record, setRecord] = useState<StudyRecordV1 | null>(null)

  const subjectGroups = useMemo(
    () =>
      examSubjectIds.flatMap((id) => {
        const ids = questions
          .filter((question) => question.subject === id)
          .map((question) => question.id)
        if (ids.length === 0) return []
        return [
          {
            key: id,
            title: subjectLabel(id),
            href: browseCategoryHref(id),
            ids,
          },
        ]
      }),
    [questions]
  )

  const topicGroups = useMemo(
    () =>
      studyTopicIds.flatMap((id) => {
        const ids = questions
          .filter((question) => question.studyTopics?.includes(id))
          .map((question) => question.id)
        if (ids.length === 0) return []
        return [
          {
            key: id,
            title: studyTopicLabel(id),
            href: browseCategoryHref(id),
            ids,
          },
        ]
      }),
    [questions]
  )

  useEffect(() => {
    const sync = () => {
      setRecord(loadStudyRecord())
    }

    sync()
    document.addEventListener("astro:page-load", sync)
    return () => document.removeEventListener("astro:page-load", sync)
  }, [])

  if (!record) {
    return (
      <div className="grid gap-3" aria-hidden="true">
        <div className="h-10 rounded-lg bg-muted" />
        <div className="h-16 rounded-xl bg-muted" />
        <div className="h-16 rounded-xl bg-muted" />
      </div>
    )
  }

  if (!hasAnyAttempts(record)) {
    return (
      <EmptyState>
        <p>まだ解答の記録がありません。</p>
        <p>記録はこの端末のブラウザに保存されます。</p>
      </EmptyState>
    )
  }

  return (
    <div className="grid gap-8">
      <AccuracySection
        title="試験科目"
        groups={subjectGroups}
        record={record}
      />
      {topicGroups.length > 0 ? (
        <AccuracySection
          title="理工学・放射線科学（細分）"
          groups={topicGroups}
          record={record}
        />
      ) : null}
    </div>
  )
}

function AccuracySection({
  title,
  groups,
  record,
}: {
  title: string
  groups: { key: string; title: string; href: string; ids: string[] }[]
  record: StudyRecordV1
}) {
  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <ul className="grid gap-3">
        {groups.map((group) => {
          const stats = summarizeCategory(record, group.ids)
          return (
            <li key={group.key}>
              <LinkCard
                href={group.href}
                title={group.title}
                description={accuracyDescription(stats)}
              />
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function accuracyDescription(stats: CategoryAccuracy) {
  if (stats.attempted === 0) {
    return `解いた 0 / ${stats.total}問`
  }

  const percent = Math.round((stats.correct / stats.attempted) * 100)
  const sampleNote =
    stats.attempted < ACCURACY_SAMPLE_MIN ? "（参考値）" : ""
  return `解いた ${stats.attempted} / ${stats.total}問 · 正答率 ${percent}%${sampleNote}`
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
      <LinkCard
        href={examsHref()}
        title="類似問題を解く"
        description="年次または科目から探せます"
        direction="back"
      />
    </div>
  )
}
