import fs from "node:fs"
import path from "node:path"
import type { ExamYearManifest } from "../../src/lib/exam-manifest.ts"
import type { ExamSession } from "../../src/lib/questions.ts"
import type { ExamSubjectId, StudyTopicId } from "../../src/lib/exam-subjects.ts"
import { repoRoot } from "./exam-pdf.ts"

export const questionsDir = path.join(repoRoot, "src/content/questions")
export const manifestsDir = path.join(repoRoot, "src/data/exam-manifests")

export type QuestionMapsTo = {
  year: number
  exam: number
  session: ExamSession
  number: number
  answer?: number | number[]
  scoringExcluded?: boolean
}

export type QuestionChoice = {
  text: string
  explanation?: string
}

export type QuestionJson = {
  year: number
  exam: number
  session: ExamSession
  number: number
  origin?: string
  mapsTo: QuestionMapsTo
  subject: ExamSubjectId
  studyTopics?: StudyTopicId[]
  stem: string
  choices: QuestionChoice[]
  answer: number | number[]
  terms?: string[]
  sourceExplanation?: string
  draft?: boolean
}

export type QuestionFile = {
  name: string
  filePath: string
  data: QuestionJson
}

export function parseQuestionJsonFiles(): QuestionFile[] {
  return fs
    .readdirSync(questionsDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const filePath = path.join(questionsDir, name)
      const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as QuestionJson
      return { name, filePath, data }
    })
}

export function expectedQuestionFileName(data: {
  year: number
  exam: number
  session: ExamSession
  number: number
}) {
  return `${data.year}-${data.exam}th-${data.session}-${String(data.number).padStart(3, "0")}.json`
}

export function loadYearManifest(year: number) {
  const filePath = path.join(manifestsDir, `${year}.json`)
  if (!fs.existsSync(filePath)) return undefined
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as ExamYearManifest
}

export function officialAnswerEquals(
  mapsTo: QuestionMapsTo,
  officialAnswer: number | number[] | null,
  scoringExcluded: boolean
) {
  if (scoringExcluded) {
    return mapsTo.scoringExcluded === true && mapsTo.answer === undefined
  }
  if (officialAnswer === null) return false
  return answersEqual(mapsTo.answer, officialAnswer)
}

export function answersEqual(
  left: number | number[] | undefined,
  right: number | number[] | null
) {
  if (left === undefined || right === null) return false
  const a = Array.isArray(left) ? [...left].sort((x, y) => x - y) : [left]
  const b = Array.isArray(right) ? [...right].sort((x, y) => x - y) : [right]
  return a.length === b.length && a.every((value, index) => value === b[index])
}
