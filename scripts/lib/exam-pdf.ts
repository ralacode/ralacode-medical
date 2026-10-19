/**
 * exam:pdf-text / exam:pdf-render 共通のヘルパー。
 * 引数から公式 PDF のローカルパスを解決し、pdfjs でページを読む。
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist/legacy/build/pdf.mjs"
import {
  examData,
  examPdfKinds,
  isExamPdfKind,
  localExamPdfPath,
} from "../../src/lib/exam-data.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(__dirname, "../..")

export type ResolvedExamPdf = {
  /** 絶対パス */
  absolutePath: string
  /** 出力ファイル名などに使う識別子。例: 2026-78th-am */
  label: string
}

/**
 * 位置引数を PDF に解決する。
 * - `<year> <kind>` … src/lib/exam-data.ts の表からローカルパスを解決（例: 2026 am、2026 am-supplement、2026 answers）
 * - `<path/to.pdf>` … 任意のローカル PDF
 */
export function resolveExamPdf(positional: string[]): ResolvedExamPdf {
  if (positional.length === 1 && positional[0]!.toLowerCase().endsWith(".pdf")) {
    const absolutePath = path.resolve(repoRoot, positional[0]!)
    return {
      absolutePath,
      label: path.basename(absolutePath, path.extname(absolutePath)),
    }
  }

  if (positional.length === 2) {
    const year = Number(positional[0])
    const kind = positional[1]!
    if (!Number.isInteger(year) || !examData[year]) {
      throw new Error(
        `src/lib/exam-data.ts に ${positional[0]} 年のエントリがありません`
      )
    }
    if (!isExamPdfKind(kind)) {
      throw new Error(
        `種別は ${examPdfKinds.join(" / ")} のいずれかです（指定: ${kind}）`
      )
    }
    const relativePath = localExamPdfPath(year, kind)!
    const absolutePath = path.join(repoRoot, relativePath)
    if (!fs.existsSync(absolutePath)) {
      throw new Error(
        `${relativePath} がありません。先に \`pnpm exam:fetch-pdfs --year ${year}\` を実行してください`
      )
    }
    return {
      absolutePath,
      label: path.basename(relativePath, ".pdf"),
    }
  }

  throw new Error(
    "PDF の指定は `<year> <kind>`（例: 2026 am）または `<path/to.pdf>` です"
  )
}

/** "5-7,9" → [5, 6, 7, 9]。範囲は 1 始まりの PDF ページ番号 */
export function parsePageSpec(spec: string, numPages: number): number[] {
  const pages = new Set<number>()
  for (const part of spec.split(",")) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const match = trimmed.match(/^(\d+)(?:-(\d+))?$/)
    if (!match) throw new Error(`ページ指定が不正です: ${trimmed}`)
    const from = Number(match[1])
    const to = match[2] ? Number(match[2]) : from
    if (from < 1 || to > numPages || from > to) {
      throw new Error(
        `ページ範囲 ${trimmed} が PDF の範囲（1〜${numPages}）を外れています`
      )
    }
    for (let page = from; page <= to; page += 1) pages.add(page)
  }
  return [...pages].sort((a, b) => a - b)
}

/** pdfjs-dist の同梱リソース（CJK の CMap・標準フォント・画像デコーダ）。無いと日本語テキストが取れない */
const pdfjsRoot = path.dirname(
  fileURLToPath(import.meta.resolve("pdfjs-dist/package.json"))
)
// Node の pdfjs は http(s) 以外の URL を fs で読むため、file:// ではなくパス文字列を渡す（末尾は "/" 必須。Windows でも fs は "/" を解釈する）
const pdfjsResourceUrl = (dir: string) =>
  `${path.join(pdfjsRoot, dir).replace(/\\/g, "/")}/`

export async function loadExamPdf(absolutePath: string): Promise<PDFDocumentProxy> {
  const data = new Uint8Array(fs.readFileSync(absolutePath))
  return getDocument({
    data,
    disableFontFace: true,
    cMapUrl: pdfjsResourceUrl("cmaps"),
    cMapPacked: true,
    standardFontDataUrl: pdfjsResourceUrl("standard_fonts"),
    wasmUrl: pdfjsResourceUrl("wasm"),
  }).promise
}

/** 問題番号行: 「31 画像に…」「2 1.5 T MRI…」の半角スペース区切り。選択肢「1．」（全角ピリオド）は除外。分割された 100 は「00」のまま残ることがある */
const QUESTION_HEADING_RE = /^([1-9]\d{0,2}|00) (?=\S)/
/** 表紙のマーク欄「1 2 3 4 5」。見出し番号の残りが数字だけなら問ではない */
const MARK_SHEET_REST_RE = /^[\d\s]+$/
/** 選択肢 1 の行。見出し候補の直後にこれがあるものだけを問番号とみなす（表紙・注意書きの「2 …」を除外） */
const FIRST_CHOICE_RE = /^1[．.]/
/** 肢が図だけの問は「1．」がテキストに出ない。定型の問い文があれば見出しとみなす */
const QUESTION_PROMPT_RE = /正しいのはどれか|誤っているのはどれか|2\s*つ選べ/
/** 表紙・注意の解答例。ここを問1と先に確定すると、本文の問1（通常 5 ページ）を取りこぼす */
const INSTRUCTION_COVER_RE = /指示があるまで開かない|（例\s*1\s*）|\(例\s*1\s*\)/
/** フッターは 1 テキスト項目（例: "DKIX-06-前H-5"）。連結後だと隣のページ番号と癒着するので項目単位で見る */
const FOOTER_ITEM_RE = /([前後]H-\d+)$/

function isInstructionCover(lines: string[]) {
  return INSTRUCTION_COVER_RE.test(lines.join("\n"))
}

/**
 * pdfjs が 3 桁の問番号「100」を、左にはみ出した「1」と「00 …」に分けることがある。
 * 描画順では「00」が先、「1」がページ末に来る。同一ページの孤立した「1」を先頭に戻す。
 */
export function rejoinSplitQuestionHeading(lines: string[]) {
  const leftoverIndexes: number[] = []
  const headingIndexes: number[] = []
  lines.forEach((line, index) => {
    if (line === "1") leftoverIndexes.push(index)
    else if (/^00 (?=\S)/.test(line)) headingIndexes.push(index)
  })
  if (leftoverIndexes.length !== 1 || headingIndexes.length !== 1) return lines

  const leftoverIndex = leftoverIndexes[0]!
  const headingIndex = headingIndexes[0]!
  const next = lines.filter((_, index) => index !== leftoverIndex)
  const adjustedHeadingIndex =
    leftoverIndex < headingIndex ? headingIndex - 1 : headingIndex
  next[adjustedHeadingIndex] = `1${next[adjustedHeadingIndex]!}`
  return next
}

function headingNumber(raw: string) {
  return raw === "00" ? 100 : Number(raw)
}

/** ページ内の問番号候補（緩い判定。表の数字や折り返し行も拾うので assignQuestionPages で絞る） */
export function detectQuestionCandidates(lines: string[]) {
  const normalized = rejoinSplitQuestionHeading(lines)
  if (isInstructionCover(normalized)) return []
  const numbers = new Set<number>()
  normalized.forEach((line, index) => {
    const match = line.match(QUESTION_HEADING_RE)
    if (!match) return
    const rest = line.slice(match[0].length).trim()
    if (rest !== "" && MARK_SHEET_REST_RE.test(rest)) return
    const following = normalized.slice(index, index + 13)
    if (
      following.some(
        (next) => FIRST_CHOICE_RE.test(next) || QUESTION_PROMPT_RE.test(next)
      )
    ) {
      numbers.add(headingNumber(match[1]!))
    }
  })
  return [...numbers].sort((a, b) => a - b)
}

/**
 * 候補をページ順に走査し、問番号が 1 から順に増えるものだけ採用する。
 * 表紙の注意書き・問題文中の数値・表の中の番号（「1 2 3 4 5」）を除ける。
 * 見出しを 1〜2 問取りこぼしても続きを拾えるよう、期待値 +2 までは許容する。
 */
export function assignQuestionPages(pages: ExamPdfPageText[]) {
  const questionPages = new Map<number, number>()
  let expected = 1
  for (const page of pages) {
    for (const candidate of page.questionCandidates) {
      if (candidate >= expected && candidate <= expected + 2) {
        questionPages.set(candidate, page.pageNumber)
        expected = candidate + 1
      }
    }
  }
  return questionPages
}

export async function readAllExamPdfPages(document: PDFDocumentProxy) {
  const pages: ExamPdfPageText[] = []
  for (let n = 1; n <= document.numPages; n += 1) {
    pages.push(await readExamPdfPage(await document.getPage(n)))
  }
  return pages
}

export type ExamPdfPageText = {
  pageNumber: number
  /** 人が読む用。行末情報を使って改行 */
  readable: string
  /** 問題用紙フッター（前H-N / 後H-N）。無ければ undefined */
  footerLabel?: string
  /** そのページの問番号候補（誤検出を含む。確定は assignQuestionPages） */
  questionCandidates: number[]
}

export async function readExamPdfPage(page: PDFPageProxy): Promise<ExamPdfPageText> {
  const content = await page.getTextContent()
  let readable = ""
  let footerLabel: string | undefined
  for (const item of content.items) {
    if (!("str" in item)) continue
    readable += item.str
    if (item.hasEOL) readable += "\n"
    footerLabel ??= item.str.trim().match(FOOTER_ITEM_RE)?.[1]
  }
  readable = readable.trim()
  const lines = rejoinSplitQuestionHeading(
    readable.split("\n").map((line) => line.trim())
  )
  return {
    pageNumber: page.pageNumber,
    readable: lines.join("\n"),
    footerLabel,
    questionCandidates: detectQuestionCandidates(lines),
  }
}
