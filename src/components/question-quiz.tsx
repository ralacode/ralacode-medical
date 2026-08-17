import { useEffect, useMemo, useState } from "react"
import { CheckIcon, RotateCcwIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  readChoiceOrderMode,
  shuffleItems,
  writeChoiceOrderMode,
  type ChoiceOrderMode,
} from "@/lib/choice-order"
import { cn } from "@/lib/utils"

type Choice = {
  text: string
  explanationHtml: string
}

type OrderedChoice = Choice & {
  originalNumber: number
}

type QuestionQuizProps = {
  labelledBy: string
  choices: Choice[]
  answer: number
  shuffleChoices?: boolean
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

function ChoiceOrderToggle({
  mode,
  shuffleable,
  onChange,
}: {
  mode: ChoiceOrderMode
  shuffleable: boolean
  onChange: (mode: ChoiceOrderMode) => void
}) {
  const labelId = "choice-order-label"

  return (
    <div className="grid justify-end gap-1">
      <p id={labelId} className="text-xs text-muted-foreground">
        選択肢の順番
      </p>
      <div
        className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-0.5"
        role="radiogroup"
        aria-labelledby={labelId}
      >
        <button
          type="button"
          role="radio"
          aria-checked={mode === "original"}
          className={cn(
            "inline-flex min-h-9 items-center justify-center rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors",
            mode === "original" && "bg-background text-foreground shadow-sm"
          )}
          onClick={() => onChange("original")}
        >
          デフォルト
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={mode === "random"}
          aria-disabled={!shuffleable}
          disabled={!shuffleable}
          className={cn(
            "inline-flex min-h-9 items-center justify-center rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            mode === "random" &&
              shuffleable &&
              "bg-background text-foreground shadow-sm"
          )}
          onClick={() => onChange("random")}
        >
          ランダム
        </button>
      </div>
      {!shuffleable ? (
        <p className="text-xs text-muted-foreground">
          この問題は選択肢の順を固定しています
        </p>
      ) : null}
    </div>
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

function orderChoices(
  choices: OrderedChoice[],
  mode: ChoiceOrderMode,
  shuffleable: boolean
) {
  if (mode === "random" && shuffleable) return shuffleItems(choices)
  return choices
}

export function QuestionQuiz({
  labelledBy,
  choices,
  answer,
  shuffleChoices = true,
  sourceExplanationHtml,
  sourceExplanationTitle = "対応する過去問の解説",
}: QuestionQuizProps) {
  const indexed = useMemo(
    () =>
      choices.map((choice, index) => ({
        ...choice,
        originalNumber: index + 1,
      })),
    [choices]
  )

  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<ChoiceOrderMode>("original")
  const [ordered, setOrdered] = useState<OrderedChoice[]>(indexed)
  const [value, setValue] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const nextMode = readChoiceOrderMode()
    setMode(nextMode)
    setOrdered(orderChoices(indexed, nextMode, shuffleChoices))
    setValue(null)
    setSubmitted(false)
    setMounted(true)
  }, [indexed, shuffleChoices])

  const displayAnswer =
    ordered.findIndex((choice) => choice.originalNumber === answer) + 1
  const selected = value ? Number(value) : undefined
  const correct = submitted && selected === displayAnswer
  const explainedCount = choices.filter((choice) => choice.explanationHtml)
    .length

  useEffect(() => {
    if (!submitted) return
    scrollPageToTop()
  }, [submitted])

  function startAttempt(nextMode: ChoiceOrderMode) {
    setValue(null)
    setSubmitted(false)
    setOrdered(orderChoices(indexed, nextMode, shuffleChoices))
  }

  function handleModeChange(nextMode: ChoiceOrderMode) {
    writeChoiceOrderMode(nextMode)
    setMode(nextMode)
    startAttempt(nextMode)
  }

  function handleSubmit(event: { preventDefault(): void }) {
    event.preventDefault()
    if (!selected) return
    setSubmitted(true)
  }

  function handleRetry() {
    startAttempt(mode)
  }

  if (!mounted) {
    return (
      <div className="grid gap-6" aria-hidden="true">
        <div className="ml-auto h-10 w-40 rounded-lg bg-muted" />
        <div className="grid gap-2">
          {choices.map((_, index) => (
            <div
              key={index}
              className="min-h-16 rounded-xl border border-border bg-card"
            />
          ))}
        </div>
        <div className="h-9 w-20 rounded-lg bg-muted" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <ChoiceOrderToggle
        mode={shuffleChoices ? mode : "original"}
        shuffleable={shuffleChoices}
        onChange={handleModeChange}
      />

      {submitted ? (
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <ResultStatus correct={correct} answer={displayAnswer} live />
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
        {ordered.map((choice, index) => {
          const number = index + 1
          const showCorrect = submitted && number === displayAnswer
          const showWrong =
            submitted && selected === number && number !== displayAnswer

          return (
            <div
              key={choice.originalNumber}
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
            <ResultStatus correct={correct} answer={displayAnswer} />
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
