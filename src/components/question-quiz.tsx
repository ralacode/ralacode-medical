import { useEffect, useState } from "react"
import { CheckIcon, RotateCcwIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

type QuestionQuizProps = {
  labelledBy: string
  choices: {
    text: string
    explanationHtml: string
  }[]
  answer: number
  sourceExplanationHtml?: string
  sourceExplanationTitle?: string
}

function ResultStatus({
  correct,
  answer,
  live,
}: {
  correct: boolean
  answer: number
  live?: boolean
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 text-sm font-medium",
        correct
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-destructive"
      )}
      aria-live={live ? "polite" : undefined}
    >
      {correct ? (
        <CheckIcon className="size-4" aria-hidden="true" />
      ) : (
        <XIcon className="size-4" aria-hidden="true" />
      )}
      {correct ? "正解です" : `不正解です。正解は ${answer} です。`}
    </p>
  )
}

function scrollPageToTop() {
  const scroller = document.querySelector("[data-slot='page-scroll']")
  if (scroller instanceof HTMLElement) {
    scroller.scrollTo({ top: 0, behavior: "smooth" })
    return
  }
  window.scrollTo({ top: 0, behavior: "smooth" })
}

export function QuestionQuiz({
  labelledBy,
  choices,
  answer,
  sourceExplanationHtml,
  sourceExplanationTitle = "対応する過去問の解説",
}: QuestionQuizProps) {
  const [value, setValue] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const selected = value ? Number(value) : undefined
  const correct = submitted && selected === answer
  const explainedCount = choices.filter((choice) => choice.explanationHtml).length

  useEffect(() => {
    if (!submitted) return
    scrollPageToTop()
  }, [submitted])

  function handleSubmit(event: { preventDefault(): void }) {
    event.preventDefault()
    if (!selected) return
    setSubmitted(true)
  }

  function handleRetry() {
    setValue(null)
    setSubmitted(false)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      {submitted ? (
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <ResultStatus correct={correct} answer={answer} live />
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleRetry}
            >
              <RotateCcwIcon />
              やり直す
            </Button>
          </div>
          {explainedCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              {explainedCount === choices.length
                ? "各選択肢に解説を表示しています"
                : "正解の選択肢に解説を表示しています"}
            </p>
          ) : null}
        </div>
      ) : null}

      <RadioGroup
        name="choice"
        value={value}
        onValueChange={(next) => {
          if (!submitted) setValue(next)
        }}
        readOnly={submitted}
        aria-labelledby={labelledBy}
        className="gap-2"
      >
        {choices.map((choice, index) => {
          const number = index + 1
          const showCorrect = submitted && number === answer
          const showWrong =
            submitted && selected === number && number !== answer

          return (
            <div
              key={number}
              className={cn(
                "grid gap-2 rounded-xl border border-border bg-card p-3 text-base leading-relaxed transition-colors",
                submitted
                  ? "cursor-default"
                  : "cursor-pointer hover:bg-muted/60",
                showCorrect && "border-emerald-600/50 bg-emerald-500/10",
                showWrong && "border-destructive/50 bg-destructive/10"
              )}
              onClick={() => {
                if (!submitted) setValue(String(number))
              }}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem
                  value={String(number)}
                  className="mt-0.5"
                  aria-label={`${number}. ${choice.text}`}
                />
                <span>
                  <span className="mr-2 font-medium tabular-nums">
                    {number}.
                  </span>
                  {choice.text}
                </span>
              </div>
              {submitted && choice.explanationHtml ? (
                <div
                  className="explanation-md ps-7 text-base"
                  dangerouslySetInnerHTML={{ __html: choice.explanationHtml }}
                />
              ) : null}
            </div>
          )
        })}
      </RadioGroup>

      <div className="flex flex-wrap items-center gap-3">
        {submitted ? (
          <>
            <ResultStatus correct={correct} answer={answer} />
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleRetry}
            >
              <RotateCcwIcon />
              やり直す
            </Button>
          </>
        ) : (
          <Button type="submit" size="lg" disabled={!value}>
            回答
          </Button>
        )}
      </div>

      {submitted && sourceExplanationHtml ? (
        <section className="grid gap-2 rounded-xl border border-border bg-muted/40 p-4">
          <h2 className="text-base font-medium text-foreground">
            {sourceExplanationTitle}
          </h2>
          <div
            className="explanation-md text-base"
            dangerouslySetInnerHTML={{ __html: sourceExplanationHtml }}
          />
        </section>
      ) : null}
    </form>
  )
}
