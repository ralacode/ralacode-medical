import type { ExamSession } from "@/lib/questions"

/** [問番号 from, 問番号 to, PDF ページ（1-indexed）] */
export type ExamPdfPageRange = [from: number, to: number, page: number]

export type ExamPdfKind =
  | "am"
  | "pm"
  | "am-supplement"
  | "pm-supplement"
  | "answers"

export const examPdfKinds: readonly ExamPdfKind[] = [
  "am",
  "pm",
  "am-supplement",
  "pm-supplement",
  "answers",
]

export function isExamPdfKind(value: string): value is ExamPdfKind {
  return (examPdfKinds as readonly string[]).includes(value)
}

/**
 * 年次ごとの試験データ。新しい年を追加するときは、このオブジェクトに 1 エントリ足す
 * （URL は厚労省の公式ページから、ページ範囲・別冊ページは pnpm exam:pdf-text --toc の結果から埋める）。
 *
 * - pdfs: 厚労省の公式 PDF URL（問題・別冊・正答表）
 * - pageRanges: 問題 PDF 内の「問番号 → PDF ページ（1-indexed）」の範囲表
 * - bookletPages: 別冊 PDF 内の「問番号 → PDF ページ（1-indexed）」（別冊がある問だけ）
 */
export type ExamYearData = {
  /** 回次（第 N 回） */
  exam: number
  pdfs: {
    am: string
    pm: string
    amSupplement?: string
    pmSupplement?: string
    answers?: string
  }
  pageRanges: {
    am: ExamPdfPageRange[]
    pm: ExamPdfPageRange[]
  }
  bookletPages: {
    am: Record<number, number>
    pm: Record<number, number>
  }
}

export const examData: Record<number, ExamYearData> = {
  2026: {
    exam: 78,
    pdfs: {
      am: "https://www.mhlw.go.jp/seisakunitsuite/bunya/kenkou_iryou/iryou/topics/dl/tp260424-06a_01.pdf",
      pm: "https://www.mhlw.go.jp/seisakunitsuite/bunya/kenkou_iryou/iryou/topics/dl/tp260424-06b_01.pdf",
      amSupplement:
        "https://www.mhlw.go.jp/seisakunitsuite/bunya/kenkou_iryou/iryou/topics/dl/tp260424-06a_02.pdf",
      pmSupplement:
        "https://www.mhlw.go.jp/seisakunitsuite/bunya/kenkou_iryou/iryou/topics/dl/tp260424-06b_02.pdf",
      answers:
        "https://www.mhlw.go.jp/general/sikaku/successlist/2026/siken06/dl/seitouhyou.pdf",
    },
    pageRanges: {
      // 2026年午前 PDF の 1-indexed ページ。表紙・注意のあと、問1は 5 ページ目
      am: [
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
      ],
      // 2026年午後 PDF の 1-indexed ページ。表紙・注意のあと、問1は 5 ページ目
      pm: [
        [1, 2, 5],
        [3, 4, 6],
        [5, 6, 7],
        [7, 7, 8],
        [8, 9, 9],
        [10, 10, 10],
        [11, 12, 10],
        [13, 15, 11],
        [16, 18, 12],
        [19, 21, 13],
        [22, 24, 14],
        [25, 27, 15],
        [28, 29, 16],
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
        [65, 65, 30],
        [66, 67, 31],
        [68, 68, 31],
        [69, 71, 32],
        [72, 72, 33],
        [73, 75, 34],
        [76, 78, 35],
        [79, 81, 36],
        [82, 84, 37],
        [85, 87, 38],
        [88, 90, 39],
        [91, 92, 40],
        [93, 95, 41],
        [96, 98, 42],
        [99, 100, 43],
      ],
    },
    bookletPages: {
      // 2026年午前 別冊。表紙のあと、No.1（問4）は 5 ページ目
      am: {
        4: 5,
        6: 6,
        7: 7,
        9: 8,
        10: 9,
        15: 10,
        28: 11,
        29: 12,
        88: 14,
        90: 16,
        91: 17,
        92: 18,
      },
      // 2026年午後 別冊。表紙のあと No.1（問5）は 5 ページ目
      pm: {
        5: 5,
        8: 6,
        9: 7,
        10: 8,
        19: 9,
        90: 10,
        91: 11,
        92: 12,
      },
    },
  },
}

export function examYearData(year: number): ExamYearData | undefined {
  return examData[year]
}

/** リポジトリルートからの相対パス。例: exams/2026/2026-78th-am.pdf（gitignore） */
export function localExamPdfPath(year: number, kind: ExamPdfKind) {
  const data = examData[year]
  if (!data) return undefined
  return `exams/${year}/${year}-${data.exam}th-${kind}.pdf`
}

export function examPdfUrl(year: number, kind: ExamPdfKind): string | undefined {
  const data = examData[year]
  if (!data) return undefined
  switch (kind) {
    case "am":
      return data.pdfs.am
    case "pm":
      return data.pdfs.pm
    case "am-supplement":
      return data.pdfs.amSupplement
    case "pm-supplement":
      return data.pdfs.pmSupplement
    case "answers":
      return data.pdfs.answers
  }
}

function pageRangesFor(
  year: number,
  session: ExamSession
): ExamPdfPageRange[] | undefined {
  const data = examData[year]
  if (!data) return undefined
  return data.pageRanges[session]
}

export function examPdfPageFromRanges(
  ranges: ExamPdfPageRange[],
  number: number
) {
  return ranges.find(([from, to]) => number >= from && number <= to)?.[2]
}

export function officialExamPdfPage(
  year: number,
  session: ExamSession,
  number: number
) {
  const ranges = pageRangesFor(year, session)
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

export function registeredExamQuestionNumbersFor(
  year: number,
  session: ExamSession
): number[] {
  const ranges = pageRangesFor(year, session)
  if (!ranges) return []
  return registeredExamQuestionNumbers(ranges)
}

export type OfficialPdfLink = {
  href: string
  page?: number
}

function withPdfPage(href: string, page?: number): OfficialPdfLink {
  return page ? { href: `${href}#page=${page}`, page } : { href }
}

export function officialExamPdfLink(
  year: number,
  session: ExamSession,
  number: number
) {
  const href = examData[year]?.pdfs[session]
  if (!href) return undefined
  return withPdfPage(href, officialExamPdfPage(year, session, number))
}

export function officialExamBookletPdfLink(
  year: number,
  session: ExamSession,
  number: number
) {
  const data = examData[year]
  const href =
    session === "am" ? data?.pdfs.amSupplement : data?.pdfs.pmSupplement
  if (!href) return undefined

  const page = data?.bookletPages[session][number]
  if (!page) return undefined

  return withPdfPage(href, page)
}

/** ローカル原本 PDF（gitignore の exams/ 配下）。問題 PDF（am/pm）のみ */
export function localExamPdfPathsFor(
  year: number
): Partial<Record<ExamSession, string>> | undefined {
  const data = examData[year]
  if (!data) return undefined
  return {
    am: localExamPdfPath(year, "am"),
    pm: localExamPdfPath(year, "pm"),
  }
}

export const examYears = Object.keys(examData).map(Number)
