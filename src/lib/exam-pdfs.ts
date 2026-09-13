import type { ExamSession } from "@/lib/questions"
import { officialExamPdfPage as lookupOfficialExamPdfPage } from "@/lib/exam-pdf-page-ranges"

export type OfficialPdfLink = {
  href: string
  page?: number
}

const officialExamPdfs: Record<number, Partial<Record<ExamSession, string>>> = {
  2026: {
    am: "https://www.mhlw.go.jp/seisakunitsuite/bunya/kenkou_iryou/iryou/topics/dl/tp260424-06a_01.pdf",
    pm: "https://www.mhlw.go.jp/seisakunitsuite/bunya/kenkou_iryou/iryou/topics/dl/tp260424-06b_01.pdf",
  },
}

const officialExamBookletPdfs: Record<
  number,
  Partial<Record<ExamSession, string>>
> = {
  2026: {
    am: "https://www.mhlw.go.jp/seisakunitsuite/bunya/kenkou_iryou/iryou/topics/dl/tp260424-06a_02.pdf",
    pm: "https://www.mhlw.go.jp/seisakunitsuite/bunya/kenkou_iryou/iryou/topics/dl/tp260424-06b_02.pdf",
  },
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
  return withPdfPage(href, lookupOfficialExamPdfPage(year, session, number))
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

/** 2026年午後 別冊（随時追記）。表紙のあと No.1（問5）は 5 ページ目 */
const pm2026BookletPages: Record<number, number> = {
  5: 5,
  8: 6,
  9: 7,
  10: 8,
  19: 9,
  90: 10,
  91: 11,
  92: 12,
}

export function officialExamBookletPdfLink(
  year: number,
  session: ExamSession,
  number: number
) {
  const href = officialExamBookletPdfs[year]?.[session]
  if (!href) return undefined

  const page =
    year === 2026 && session === "am"
      ? am2026BookletPages[number]
      : year === 2026 && session === "pm"
        ? pm2026BookletPages[number]
        : undefined
  if (!page) return undefined

  return withPdfPage(href, page)
}
