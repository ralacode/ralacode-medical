import type {
  BrowseCategoryId,
  ExamSubjectId,
  StudyTopicId,
} from "@/lib/exam-subjects"
import {
  examSubjectIds,
  isStudyTopicId,
  studyTopicIds,
  studyTopicLabel,
  subjectLabel,
} from "@/lib/exam-subjects"
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
  studyTopics?: StudyTopicId[]
}

export function sessionLabel(session: ExamSession) {
  return session === "am" ? "午前" : "午後"
}

export function answerLabel(answer: number | number[]) {
  const values = Array.isArray(answer) ? answer : [answer]
  return `正解は${values.join("と")}です`
}

export const scoringExcludedAnswerLabel = "採点除外（公式正答なし）"

export type QuestionMapsTo =
  | {
      year: number
      exam: number
      session: ExamSession
      number: number
      answer: number | number[]
    }
  | {
      year: number
      exam: number
      session: ExamSession
      number: number
      scoringExcluded: true
    }

export function isScoringExcluded(
  mapsTo: QuestionMapsTo
): mapsTo is Extract<QuestionMapsTo, { scoringExcluded: true }> {
  return "scoringExcluded" in mapsTo && mapsTo.scoringExcluded === true
}

export function sourceOfficialAnswerLabel(mapsTo: QuestionMapsTo) {
  if (isScoringExcluded(mapsTo)) return scoringExcludedAnswerLabel
  return answerLabel(mapsTo.answer)
}

export function examsHref() {
  return withBase("exams/")
}

export function yearHref(year: number) {
  return withBase(`exams/${year}/`)
}

export function browseCategoryHref(category: BrowseCategoryId) {
  return withBase(`exams/subjects/${category}/`)
}

/** @deprecated browseCategoryHref を使う */
export function subjectHref(subject: ExamSubjectId) {
  return browseCategoryHref(subject)
}

const FROM_QUERY_KEY = "from"
const FROM_SUBJECT_VALUE = "subject"
const TOPIC_QUERY_KEY = "topic"

export type QuestionBrowseOptions = {
  from?: "subject"
  topic?: StudyTopicId
}

export function questionHref(
  year: number,
  session: ExamSession,
  number: number,
  options?: QuestionBrowseOptions
) {
  const path = withBase(`exams/${year}/${session}/${number}/`)
  if (options?.from !== "subject") return path

  const params = new URLSearchParams()
  params.set(FROM_QUERY_KEY, FROM_SUBJECT_VALUE)
  if (options.topic) params.set(TOPIC_QUERY_KEY, options.topic)
  return `${path}?${params.toString()}`
}

export function isFromSubjectNavigation(search: string) {
  return new URLSearchParams(search).get(FROM_QUERY_KEY) === FROM_SUBJECT_VALUE
}

export function navigationTopic(search: string): StudyTopicId | undefined {
  const value = new URLSearchParams(search).get(TOPIC_QUERY_KEY)
  return value && isStudyTopicId(value) ? value : undefined
}

/** 科目名検索用（試験科目＋学習タグ） */
export function questionSearchLabels(
  item: Pick<QuestionListItem, "subject" | "studyTopics">
) {
  const labels = [subjectLabel(item.subject)]
  for (const topic of item.studyTopics ?? []) {
    labels.push(studyTopicLabel(topic))
  }
  return labels
}

export type CategoryLink = {
  href: string
  label: string
}

/** 問題ページの科目・学習タグリンク */
export function questionCategoryLinks(
  item: Pick<QuestionListItem, "subject" | "studyTopics">
): CategoryLink[] {
  const links: CategoryLink[] = [
    { href: browseCategoryHref(item.subject), label: subjectLabel(item.subject) },
  ]
  for (const topic of item.studyTopics ?? []) {
    links.push({
      href: browseCategoryHref(topic),
      label: studyTopicLabel(topic),
    })
  }
  return links
}

export type QuestionNavTarget = {
  href: string
  heading: string
  stem: string
}

export function questionNavTarget(
  item: Pick<QuestionListItem, "year" | "exam" | "session" | "number" | "stem">,
  options?: QuestionBrowseOptions
): QuestionNavTarget {
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

export function groupQuestionsByStudyTopic(questions: QuestionListItem[]) {
  const byTopic = new Map<StudyTopicId, QuestionListItem[]>()

  for (const question of questions) {
    for (const topic of question.studyTopics ?? []) {
      const list = byTopic.get(topic) ?? []
      list.push(question)
      byTopic.set(topic, list)
    }
  }

  return studyTopicIds
    .filter((id) => byTopic.has(id))
    .map((topic) => ({
      topic,
      items: byTopic.get(topic)!,
    }))
}

export function questionsInBrowseCategory(
  questions: QuestionListItem[],
  category: BrowseCategoryId
) {
  if (isStudyTopicId(category)) {
    return questions.filter((question) =>
      question.studyTopics?.includes(category)
    )
  }
  return questions.filter((question) => question.subject === category)
}

export function sortedQuestions(items: QuestionListItem[]) {
  return [...items].sort(compareQuestions)
}

export function topicNavigationForQuestion(
  allQuestions: QuestionListItem[],
  question: QuestionListItem
) {
  const navigation: Partial<
    Record<
      StudyTopicId,
      { prev?: QuestionNavTarget; next?: QuestionNavTarget }
    >
  > = {}

  for (const topic of question.studyTopics ?? []) {
    const inTopic = sortedQuestions(
      allQuestions.filter((entry) => entry.studyTopics?.includes(topic))
    )
    const index = inTopic.findIndex(
      (entry) =>
        entry.year === question.year &&
        entry.session === question.session &&
        entry.number === question.number
    )
    navigation[topic] = {
      prev:
        index > 0
          ? questionNavTarget(inTopic[index - 1]!, {
              from: "subject",
              topic,
            })
          : undefined,
      next:
        index >= 0 && index < inTopic.length - 1
          ? questionNavTarget(inTopic[index + 1]!, {
              from: "subject",
              topic,
            })
          : undefined,
    }
  }

  return navigation
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

export function singleAnswer(answer: number | number[]) {
  if (Array.isArray(answer)) {
    throw new Error("複数正解の問題は、まだ演習画面に対応していません。")
  }
  return answer
}
