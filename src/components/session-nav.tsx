import { useEffect, useState } from "react"

import { LinkCard } from "@/components/link-card"
import { sessionHref, withDrillQuery } from "@/lib/questions"
import {
  loadStudySession,
  SESSION_ANSWERED_EVENT,
  syncSessionToQuestion,
  type StudySessionV1,
} from "@/lib/study-session"

export function SessionNav({ questionId }: { questionId: string }) {
  const [session, setSession] = useState<StudySessionV1 | null | undefined>()

  useEffect(() => {
    const sync = () => {
      syncSessionToQuestion(questionId)
      setSession(loadStudySession() ?? null)
    }

    sync()
    document.addEventListener(SESSION_ANSWERED_EVENT, sync)
    document.addEventListener("astro:page-load", sync)
    return () => {
      document.removeEventListener(SESSION_ANSWERED_EVENT, sync)
      document.removeEventListener("astro:page-load", sync)
    }
  }, [questionId])

  if (session === undefined) {
    return <nav className="min-h-16" aria-hidden="true" />
  }

  if (!session) return null

  const index = session.items.findIndex((item) => item.id === questionId)
  if (index < 0) return null

  const answered = session.firstResults[questionId] !== undefined
  const next = session.items[index + 1]
  const last = index === session.items.length - 1

  return (
    <nav className="grid gap-3" aria-label="連続演習">
      <p className="text-sm text-muted-foreground">
        <span className="tabular-nums">
          {index + 1} / {session.items.length}
        </span>
        {" · "}
        {session.title}
      </p>
      {answered && next ? (
        <LinkCard
          href={withDrillQuery(next.href)}
          label={`次の問題 · ${next.heading}`}
          title={next.stem}
        />
      ) : null}
      {answered && last ? (
        <LinkCard
          href={sessionHref()}
          label="まとめへ"
          title="この連続演習の結果を見る"
        />
      ) : null}
      <LinkCard
        direction="back"
        href={sessionHref()}
        label="やめる"
        title="ここまでの結果を見る"
      />
    </nav>
  )
}
