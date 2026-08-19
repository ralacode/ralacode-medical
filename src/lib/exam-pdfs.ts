import type { ExamSession } from "@/lib/questions"

export type OfficialPdfLink = {
  href: string
  page?: number
}

const officialExamPdfs: Record<
  number,
  Partial<Record<ExamSession, string>>
> = {
  2026: {
    am: "https://www.mhlw.go.jp/seisakunitsuite/bunya/kenkou_iryou/iryou/topics/dl/tp260424-06a_01.pdf",
  },
}

const officialExamBookletPdfs: Record<
  number,
  Partial<Record<ExamSession, string>>
> = {
  2026: {
    am: "https://www.mhlw.go.jp/seisakunitsuite/bunya/kenkou_iryou/iryou/topics/dl/tp260424-06a_02.pdf",
  },
}

/** 2026年午前 PDF の 1-indexed ページ。表紙・注意のあと、問1は 5 ページ目 */
const am2026PageRanges: [from: number, to: number, page: number][] = [
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

function officialExamPdfPage(
  year: number,
  session: ExamSession,
  number: number
) {
  if (year === 2026 && session === "am") {
    return am2026PageRanges.find(
      ([from, to]) => number >= from && number <= to
    )?.[2]
  }
  return undefined
}

function withPdfPage(href: string, page?: number): OfficialPdfLink {
  return page ? { href: `${href}#page=${page}`, page } : { href }
}

export function officialExamPdfLink(
  year: number,
  session: ExamSession,
  number: number
) {
  const href = officialExamPdfs[year]?.[session]
  if (!href) return undefined
  return withPdfPage(href, officialExamPdfPage(year, session, number))
}

/** 2026年午前 別冊。表紙のあと、No.1（問4）は 5 ページ目 */
const am2026BookletPages: Record<number, number> = {
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
}

export function officialExamBookletPdfLink(
  year: number,
  session: ExamSession,
  number: number
) {
  const href = officialExamBookletPdfs[year]?.[session]
  if (!href) return undefined

  const page =
    year === 2026 && session === "am" ? am2026BookletPages[number] : undefined
  if (!page) return undefined

  return withPdfPage(href, page)
}
