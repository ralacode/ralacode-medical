import { withBase } from "@/lib/paths"

export type ExamSession = "am" | "pm"

export type QuestionListItem = {
  year: number
  exam: number
  session: ExamSession
  number: number
  stem: string
  origin: "analog"
}

export function sessionLabel(session: ExamSession) {
  return session === "am" ? "午前" : "午後"
}

export function examsHref() {
  return withBase("exams/")
}

export function yearHref(year: number) {
  return withBase(`exams/${year}/`)
}

export function questionHref(
  year: number,
  session: ExamSession,
  number: number
) {
  return withBase(`exams/${year}/${session}/${number}/`)
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

export function questionHeading(
  exam: number,
  session: ExamSession,
  number: number
) {
  return `第${exam}回 ${sessionLabel(session)} 問${number}`
}

export function singleAnswer(answer: number | number[]) {
  if (Array.isArray(answer)) {
    throw new Error("複数正解の問題は、まだ演習画面に対応していません。")
  }
  return answer
}
