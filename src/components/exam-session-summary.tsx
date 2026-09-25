import { useEffect, useState } from "react"

import { LinkCard } from "@/components/link-card"
import { examsHref } from "@/lib/questions"
import { loadStudySession, type StudySessionV1 } from "@/lib/study-session"

export function ExamSessionSummary() {
  const [session, setSession] = useState<StudySessionV1 | null | undefined>()

  useEffect(() => {
    const sync = () => {
      setSession(loadStudySession() ?? null)
    }

    sync()
    document.addEventListener("astro:page-load", sync)
    return () => document.removeEventListener("astro:page-load", sync)
  }, [])

  if (session === undefined) {
    return (
      <div className="grid gap-3" aria-hidden="true">
        <div className="h-8 w-40 rounded-lg bg-muted" />
        <div className="h-16 rounded-xl bg-muted" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="grid gap-3">
        <p className="text-sm leading-relaxed text-muted-foreground">
          連続演習の結果は、この端末に残っていません。
        </p>
        <LinkCard
          direction="back"
          href={examsHref()}
          title="国家試験対策トップ"
          description="年次または科目から探せます"
        />
      </div>
    )
  }

  const total = session.items.length
  const answered = Object.keys(session.firstResults).length
  const correct = Object.values(session.firstResults).filter(Boolean).length

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <p className="text-sm text-muted-foreground">{session.title}</p>
        <p className="text-2xl font-semibold tracking-tight">
          {total}問中 {correct}問正解
        </p>
        {answered < total ? (
          <p className="text-sm text-muted-foreground">
            {answered}問まで解答しました。点数は各問の1回目です。
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            点数は各問の1回目です。「やり直す」後の正解は含みません。
          </p>
        )}
      </div>
      <div className="grid gap-3">
        <LinkCard
          direction="back"
          href={session.returnHref}
          title="一覧に戻る"
        />
        <LinkCard
          href={examsHref()}
          title="国家試験対策トップ"
          description="年次または科目から探せます"
        />
      </div>
    </div>
  )
}
