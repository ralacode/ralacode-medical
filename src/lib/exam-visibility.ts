import { examYearData, examYears } from "@/lib/exam-data"

/**
 * 本番で問題本文を出す年。
 * 200 問揃い、公開の指示があった年だけ足す。自動では足さない。
 */
export const publishedExamYears = [2026, 2025, 2024] as const

export function catalogExamYears(questionYears: readonly number[] = []): number[] {
  return [...new Set([...examYears, ...questionYears])].sort((a, b) => b - a)
}

export function isPublishedExamYear(year: number) {
  return (publishedExamYears as readonly number[]).includes(year)
}

/**
 * 問題本文・科目横断の一覧を出してよいか。
 * 公開年は全年。未公開年は開発サーバで、その年の問があるときだけ中身を出す。
 */
export function canRevealExamYear(
  year: number,
  questionYears: readonly number[] = []
): boolean {
  if (isPublishedExamYear(year)) return true
  return import.meta.env.DEV && questionYears.includes(year)
}

export function isExamYearPreparing(
  year: number,
  questionYears: readonly number[] = []
): boolean {
  return !canRevealExamYear(year, questionYears)
}

export function examYearExamNumber(year: number, fallbackExam?: number) {
  return examYearData(year)?.exam ?? fallbackExam
}
