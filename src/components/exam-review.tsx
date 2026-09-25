import { useEffect, useMemo, useState, type ReactNode } from "react"

import { LinkCard } from "@/components/link-card"
import { StartStudySessionButton } from "@/components/start-study-session-button"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  examSubjectIds,
  subjectLabel,
  type ExamSubjectId,
} from "@/lib/exam-subjects"
import {
  examsHref,
  questionHeading,
  reviewHref,
  type ExamSession,
} from "@/lib/questions"
import {
  clearStudyRecord,
  hasAnyAttempts,
  listIncorrectFirstAttempts,
  loadStudyRecord,
  type StudyRecordV1,
} from "@/lib/study-record"
import { cn } from "@/lib/utils"

export type ReviewQuestionMeta = {
  id: string
  year: number
  exam: number
  session: ExamSession
  number: number
  subject: ExamSubjectId
  stem: string
  analog?: boolean
  choiceTexts: string[]
  categoryLinks: { href: string; label: string }[]
  href: string
}

type ExamReviewProps = {
  questions: ReviewQuestionMeta[]
}

const CLEAR_CONFIRM =
  "この端末に保存した解答記録をすべて消します。よろしいですか？"

export function ExamReview({ questions }: ExamReviewProps) {
  const [record, setRecord] = useState<StudyRecordV1 | null>(null)
  const [subject, setSubject] = useState<ExamSubjectId | "all">("all")
  const [clearError, setClearError] = useState(false)

  const questionsById = useMemo(() => {
    const map = new Map<string, ReviewQuestionMeta>()
    for (const question of questions) map.set(question.id, question)
    return map
  }, [questions])

  useEffect(() => {
    const sync = () => {
      setRecord(loadStudyRecord())
    }

    sync()
    document.addEventListener("astro:page-load", sync)
    return () => document.removeEventListener("astro:page-load", sync)
  }, [])

  const incorrect = useMemo(() => {
    if (!record) return []

    return listIncorrectFirstAttempts(record).flatMap((hit) => {
      const meta = questionsById.get(hit.questionId)
      if (!meta) return []
      return [{ ...meta, at: hit.at, selected: hit.selected }]
    })
  }, [questionsById, record])

  const subjectsWithItems = examSubjectIds.filter((id) =>
    incorrect.some((item) => item.subject === id)
  )
  const activeSubject =
    subject !== "all" && subjectsWithItems.includes(subject) ? subject : "all"
  const visible =
    activeSubject === "all"
      ? incorrect
      : incorrect.filter((item) => item.subject === activeSubject)

  function handleClear() {
    if (!window.confirm(CLEAR_CONFIRM)) return
    const saved = clearStudyRecord()
    if (!saved.ok) {
      setClearError(true)
      return
    }
    setClearError(false)
    setSubject("all")
    setRecord(loadStudyRecord())
  }

  if (!record) {
    return (
      <div className="grid gap-3" aria-hidden="true">
        <div className="h-10 rounded-lg bg-muted" />
        <div className="h-16 rounded-xl bg-muted" />
        <div className="h-16 rounded-xl bg-muted" />
      </div>
    )
  }

  const recorded = hasAnyAttempts(record)

  const sessionTitle =
    activeSubject === "all"
      ? "間違えた問題"
      : `間違えた問題（${subjectLabel(activeSubject)}）`

  return (
    <div className="grid gap-6">
      {visible.length > 0 ? (
        <StartStudySessionButton
          title={sessionTitle}
          items={visible.map((item) => ({
            id: item.id,
            href: item.href,
            heading: questionHeading(item.exam, item.session, item.number),
            stem: item.stem,
          }))}
          returnHref={reviewHref()}
        />
      ) : null}

      {incorrect.length > 0 ? (
        <div
          className="flex flex-wrap gap-1 rounded-lg bg-muted p-0.5"
          role="radiogroup"
          aria-label="科目で絞り込む"
        >
          <FilterChip
            checked={activeSubject === "all"}
            onSelect={() => setSubject("all")}
          >
            すべて
            <span className="tabular-nums">（{incorrect.length}）</span>
          </FilterChip>
          {subjectsWithItems.map((id) => {
            const count = incorrect.filter((item) => item.subject === id).length
            return (
              <FilterChip
                key={id}
                checked={activeSubject === id}
                onSelect={() => setSubject(id)}
              >
                {subjectLabel(id)}
                <span className="tabular-nums">（{count}）</span>
              </FilterChip>
            )
          })}
        </div>
      ) : null}

      {!recorded ? (
        <EmptyState>
          <p>まだ解答の記録がありません。</p>
          <p>記録はこの端末のブラウザに保存されます。</p>
        </EmptyState>
      ) : incorrect.length === 0 ? (
        <EmptyState>
          <p>いま間違えている問題はありません。</p>
          <p>直近の1回目で不正解だった問題が、ここに並びます。</p>
        </EmptyState>
      ) : (
        <ul className="grid gap-3">
          {visible.map((item) => (
            <li
              key={item.id}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <LinkCard
                bare
                href={item.href}
                label={`${questionHeading(item.exam, item.session, item.number)}${
                  item.analog ? " · 類似問題" : ""
                }`}
                title={item.stem}
                note={answerNote(item.selected, item.choiceTexts)}
              />
              {item.categoryLinks.length > 0 ? (
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
      )}

      {recorded ? (
        <div className="grid gap-2">
          <Button type="button" variant="outline" size="lg" onClick={handleClear}>
            記録をすべて消す
          </Button>
          {clearError ? (
            <p className="text-xs text-muted-foreground">
              記録を消せませんでした。ブラウザの保存容量やプライベートモードをご確認ください。
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function answerNote(selected: number, choiceTexts: string[]) {
  const text = choiceTexts[selected - 1]
  return text
    ? `あなたの回答 ${selected}. ${text}`
    : `あなたの回答 ${selected}`
}

function FilterChip({
  checked,
  onSelect,
  children,
}: {
  checked: boolean
  onSelect: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      className={cn(
        "inline-flex min-h-9 items-center justify-center rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors",
        checked && "bg-background text-foreground shadow-sm"
      )}
      onClick={onSelect}
    >
      {children}
    </button>
  )
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
