/**
 * 公式 PDF（厚生労働省）の取得元と、ローカル保存先（exams/、gitignore）の対応表。
 *
 * - `pnpm exam:fetch-pdfs` がこの表を読んで exams/{year}/ にダウンロードする。
 * - `pnpm exam:pdf-text` / `pnpm exam:pdf-render` は year + kind でローカルファイルを解決する。
 * - 新しい年次を足すときは、この表に 1 エントリ追加する（URL は厚労省の公式ページから取る）。
 *
 * TODO(第 2 弾): src/lib/exam-pdfs.ts / exam-pdf-page-ranges.ts の年次データと統合する。
 */

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

export type ExamPdfYearSource = {
  /** 回次（第 N 回） */
  exam: number
  /** 種別ごとの公式 URL。無い種別は省略 */
  urls: Partial<Record<ExamPdfKind, string>>
}

export const examPdfSources: Record<number, ExamPdfYearSource> = {
  2026: {
    exam: 78,
    urls: {
      am: "https://www.mhlw.go.jp/seisakunitsuite/bunya/kenkou_iryou/iryou/topics/dl/tp260424-06a_01.pdf",
      "am-supplement":
        "https://www.mhlw.go.jp/seisakunitsuite/bunya/kenkou_iryou/iryou/topics/dl/tp260424-06a_02.pdf",
      pm: "https://www.mhlw.go.jp/seisakunitsuite/bunya/kenkou_iryou/iryou/topics/dl/tp260424-06b_01.pdf",
      "pm-supplement":
        "https://www.mhlw.go.jp/seisakunitsuite/bunya/kenkou_iryou/iryou/topics/dl/tp260424-06b_02.pdf",
      answers:
        "https://www.mhlw.go.jp/general/sikaku/successlist/2026/siken06/dl/seitouhyou.pdf",
    },
  },
}

/** リポジトリルートからの相対パス。例: exams/2026/2026-78th-am.pdf */
export function localExamPdfPath(year: number, kind: ExamPdfKind) {
  const source = examPdfSources[year]
  if (!source) return undefined
  return `exams/${year}/${year}-${source.exam}th-${kind}.pdf`
}

export function isExamPdfKind(value: string): value is ExamPdfKind {
  return (examPdfKinds as readonly string[]).includes(value)
}
