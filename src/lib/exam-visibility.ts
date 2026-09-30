import { examYearData, examYears } from "@/lib/exam-data"

/** 本番で問題本文を出す年の数（新しい西暦から）。有料認証は後から canRevealExamYear に足す。 */
export const freeExamYearCount = 2

export function catalogExamYears(questionYears: readonly number[] = []): number[] {
  return [...new Set([...examYears, ...questionYears])].sort((a, b) => b - a)
}

export function freeExamYears(questionYears: readonly number[] = []): number[] {
  return catalogExamYears(questionYears).slice(0, freeExamYearCount)
}

export function isFreeExamYear(
  year: number,
  questionYears: readonly number[] = []
): boolean {
  return freeExamYears(questionYears).includes(year)
}

/** 問題本文・科目横断の一覧を出してよいか。開発サーバでは全年。本番は直近 2 年。 */
export function canRevealExamYear(
  year: number,
  questionYears: readonly number[] = []
): boolean {
  if (import.meta.env.DEV) return true
  return isFreeExamYear(year, questionYears)
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
