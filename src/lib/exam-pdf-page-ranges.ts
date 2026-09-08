import type { ExamSession } from "@/lib/questions"

export type ExamPdfPageRange = [from: number, to: number, page: number]

/** 2026年午前 PDF の 1-indexed ページ。表紙・注意のあと、問1は 5 ページ目 */
export const am2026PageRanges: ExamPdfPageRange[] = [
  [1, 3, 5],
  [4, 5, 6],
  [6, 7, 7],
  [8, 9, 8],
  [10, 12, 9],
  [13, 14, 10],
  [15, 17, 11],
  [18, 20, 12],
  [21, 23, 13],
  [24, 25, 14],
  [26, 26, 15],
  [27, 28, 16],
  [29, 31, 17],
  [32, 33, 18],
  [34, 36, 19],
  [37, 39, 20],
  [40, 42, 21],
  [43, 45, 22],
  [46, 47, 23],
  [48, 49, 24],
  [50, 51, 25],
  [52, 53, 26],
  [54, 55, 27],
  [56, 56, 28],
  [57, 59, 30],
  [60, 62, 31],
  [63, 64, 32],
  [65, 65, 33],
  [66, 66, 34],
  [67, 68, 35],
  [69, 71, 36],
  [72, 73, 37],
  [74, 76, 38],
  [77, 79, 39],
  [80, 82, 40],
  [83, 85, 41],
  [86, 88, 42],
  [89, 90, 43],
  [91, 92, 44],
  [93, 94, 45],
  [95, 96, 46],
  [97, 99, 47],
  [100, 100, 48],
]

/** 2026年午後 PDF の 1-indexed ページ。表紙・注意のあと、問1は 5 ページ目（随時追記） */
export const pm2026PageRanges: ExamPdfPageRange[] = [
  [1, 2, 5],
  [3, 4, 6],
  [5, 6, 7],
  [7, 7, 8],
  [8, 9, 9],
  [10, 10, 10],
  [11, 12, 10],
  [13, 15, 11],
  [16, 18, 12],
  [19, 20, 13],
  [21, 23, 14],
  [24, 26, 15],
  [27, 28, 16],
  [29, 29, 16],
  [30, 30, 17],
  [31, 32, 17],
  [33, 35, 18],
  [36, 38, 19],
  [39, 41, 20],
  [42, 44, 21],
  [45, 47, 22],
  [48, 50, 23],
  [51, 53, 24],
  [54, 54, 25],
  [55, 56, 25],
  [57, 59, 26],
  [60, 61, 27],
  [62, 62, 28],
  [63, 64, 29],
]

/** ローカル原本 PDF（gitignore の exams/ 配下） */
export const localExamPdfPaths: Record<
  number,
  Partial<Record<ExamSession, string>>
> = {
  2026: {
    am: "exams/2026/2026-78th-am.pdf",
    pm: "exams/2026/2026-78th-pm.pdf",
  },
}

export function examPdfPageFromRanges(
  ranges: ExamPdfPageRange[],
  number: number
) {
  return ranges.find(([from, to]) => number >= from && number <= to)?.[2]
}

export function examPdfPageRangesFor(
  year: number,
  session: ExamSession
): ExamPdfPageRange[] | undefined {
  if (year === 2026 && session === "am") return am2026PageRanges
  if (year === 2026 && session === "pm") return pm2026PageRanges
  return undefined
}

export function officialExamPdfPage(
  year: number,
  session: ExamSession,
  number: number
) {
  const ranges = examPdfPageRangesFor(year, session)
  if (!ranges) return undefined
  return examPdfPageFromRanges(ranges, number)
}

export function registeredExamQuestionNumbers(
  ranges: ExamPdfPageRange[]
): number[] {
  const numbers = new Set<number>()
  for (const [from, to] of ranges) {
    for (let number = from; number <= to; number += 1) {
      numbers.add(number)
    }
  }
  return [...numbers].sort((a, b) => a - b)
}
