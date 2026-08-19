import type { ExamSubjectId } from "@/lib/exam-subjects"
import { examSubjectIds } from "@/lib/exam-subjects"
import { withBase } from "@/lib/paths"

export type ExamSession = "am" | "pm"

export type QuestionListItem = {
  year: number
  exam: number
  session: ExamSession
  number: number
  stem: string
  origin: "analog"
  subject: ExamSubjectId
}

export function sessionLabel(session: ExamSession) {
  return session === "am" ? "午前" : "午後"
}

export function answerLabel(answer: number | number[]) {
  const values = Array.isArray(answer) ? answer : [answer]
  return `正解は${values.join("と")}です`
}

export function examsHref() {
  return withBase("exams/")
}

export function yearHref(year: number) {
  return withBase(`exams/${year}/`)
}

export function subjectHref(subject: ExamSubjectId) {
  return withBase(`exams/subjects/${subject}/`)
}

export function questionHref(
  year: number,
  session: ExamSession,
  number: number,
  options?: { from?: "subject" }
) {
  const path = withBase(`exams/${year}/${session}/${number}/`)
  return options?.from === "subject" ? `${path}?from=subject` : path
}

export function questionNavTarget(
  item: Pick<QuestionListItem, "year" | "exam" | "session" | "number" | "stem">,
  options?: { from?: "subject" }
) {
  return {
    href: questionHref(item.year, item.session, item.number, options),
    heading: `${item.year}年 · ${questionHeading(item.exam, item.session, item.number)}`,
    stem: item.stem,
  }
}

export function groupQuestions(questions: QuestionListItem[]) {
  const byYear = new Map<number, QuestionListItem[]>()

  for (const question of questions) {
    const list = byYear.get(question.year) ?? []
    list.push(question)
    byYear.set(question.year, list)
  }

  return [...byYear.entries()]
    .sort(([left], [right]) => right - left)
    .map(([year, items]) => {
      const sessions: ExamSession[] = ["am", "pm"]
      return {
        year,
        exam: items[0]!.exam,
        sessions: sessions
          .map((session) => ({
            session,
            items: items
              .filter((item) => item.session === session)
              .sort((a, b) => a.number - b.number),
          }))
          .filter((group) => group.items.length > 0),
      }
    })
}

export function groupQuestionsBySubject(questions: QuestionListItem[]) {
  const bySubject = new Map<ExamSubjectId, QuestionListItem[]>()

  for (const question of questions) {
    const list = bySubject.get(question.subject) ?? []
    list.push(question)
    bySubject.set(question.subject, list)
  }

  return examSubjectIds
    .filter((id) => bySubject.has(id))
    .map((subject) => ({
      subject,
      items: bySubject.get(subject)!,
    }))
}

export function questionHeading(
  exam: number,
  session: ExamSession,
  number: number
) {
  return `第${exam}回 ${sessionLabel(session)} 問${number}`
}

export function compareQuestions(
  left: Pick<QuestionListItem, "year" | "session" | "number">,
  right: Pick<QuestionListItem, "year" | "session" | "number">
) {
  if (left.year !== right.year) return left.year - right.year
  if (left.session !== right.session) {
    return left.session === "am" ? -1 : 1
  }
  return left.number - right.number
}

export function sortQuestions<T extends Pick<QuestionListItem, "year" | "session" | "number">>(
  questions: T[]
) {
  return [...questions].sort(compareQuestions)
}

export function singleAnswer(answer: number | number[]) {
  if (Array.isArray(answer)) {
    throw new Error("複数正解の問題は、まだ演習画面に対応していません。")
  }
  return answer
}
