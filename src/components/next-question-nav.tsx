import { ArrowRightIcon } from "lucide-react"
import { useEffect, useState } from "react"

type NavTarget = {
  href: string
  heading: string
  stem: string
}

type NextQuestionNavProps = {
  examNext?: NavTarget
  subjectNext?: NavTarget
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
      const params = new URLSearchParams(window.location.search)
      setFromSubject(params.get("from") === "subject")
    }

    sync()
    document.addEventListener("astro:page-load", sync)
    return () => document.removeEventListener("astro:page-load", sync)
  }, [])

  if (fromSubject === null) {
    return <div className="min-h-16" aria-hidden="true" />
  }

  const next = fromSubject ? subjectNext : examNext
  const backHref = fromSubject ? subjectBackHref : examBackHref

  if (next) {
    return (
      <a
        className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50 active:bg-muted"
        href={next.href}
      >
        <span className="grid min-w-0 flex-1 gap-1">
          <span className="text-sm text-muted-foreground">
            次の問題 · {next.heading}
          </span>
          <span className="font-medium leading-snug">{next.stem}</span>
        </span>
        <ArrowRightIcon
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </a>
    )
  }

  return (
    <a
      className="flex min-h-16 items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50 active:bg-muted"
      href={backHref}
    >
      <span className="grid min-w-0 flex-1 gap-1">
        <span className="text-sm text-muted-foreground">
          {fromSubject
            ? `${subjectLabel}の最後の問題です`
            : `${year}年最後の問題です`}
        </span>
        <span className="font-medium leading-snug">問題一覧に戻る</span>
      </span>
      <ArrowRightIcon
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </a>
  )
}
