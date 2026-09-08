/**
 * exam-pdf-page-ranges.ts のページ表と、問題 JSON の sourceExplanation リンクが一致するか検証する。
 * ローカル PDF がある場合は、各ページのフッター（前H-N / 後H-N）も表示し、
 * 問題文がテキスト化されている PDF では問番号の自動照合も行う。
 *
 * 用法: pnpm verify:exam-pages
 * 前提: exams/2026/2026-78th-{am,pm}.pdf（gitignore、任意）
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"
import {
  examPdfPageRangesFor,
  localExamPdfPaths,
  officialExamPdfPage,
  registeredExamQuestionNumbers,
} from "../src/lib/exam-pdf-page-ranges.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const questionsDir = path.join(repoRoot, "src/content/questions")

type ExamSession = "am" | "pm"

type Failure = {
  kind: "pdf-page" | "json-link"
  message: string
}

type PdfPageInfo = {
  pageNumber: number
  footerLabel?: string
  questionNumbers: number[]
}

/** 問題番号行: 「31 画像に…」の半角スペース。選択肢「1．」の全角中点は除外 */
const QUESTION_HEADING_RE = /(?:^|[\n\r])([1-9]\d{0,2}) (?=[\u3040-\u3299\u4e00-\u9fff])/g
const FOOTER_LABEL_RE = /([前后]H-\d+)/

function resolveLocalPdf(relativePath: string) {
  return path.join(repoRoot, relativePath)
}

async function analyzePdfPages(pdfPath: string): Promise<PdfPageInfo[]> {
  const absolutePath = resolveLocalPdf(pdfPath)
  const data = new Uint8Array(fs.readFileSync(absolutePath))
  const document = await getDocument({ data, disableFontFace: true }).promise

  const pages: PdfPageInfo[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const textContent = await page.getTextContent()
    const text = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join("\n")

    const questionNumbers = [
      ...new Set(
        [...text.matchAll(QUESTION_HEADING_RE)].map((match) => Number(match[1]))
      ),
    ].sort((a, b) => a - b)

    const footerLabel = text.match(FOOTER_LABEL_RE)?.[1]

    pages.push({ pageNumber, footerLabel, questionNumbers })
  }

  return pages
}

function questionPageMapFromPdf(pages: PdfPageInfo[]) {
  const questionPages = new Map<number, number>()
  for (const { pageNumber, questionNumbers } of pages) {
    for (const questionNumber of questionNumbers) {
      if (!questionPages.has(questionNumber)) {
        questionPages.set(questionNumber, pageNumber)
      }
    }
  }
  return questionPages
}

function parseQuestionJsonFiles() {
  return fs
    .readdirSync(questionsDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const filePath = path.join(questionsDir, name)
      const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
        mapsTo?: {
          year?: number
          session?: ExamSession
          number?: number
        }
        sourceExplanation?: string
      }
      return { filePath, name, data }
    })
}

function examPdfUrlPattern(year: number, session: ExamSession) {
  if (year === 2026 && session === "am") {
    return /tp260424-06a_01\.pdf#page=(\d+)/
  }
  if (year === 2026 && session === "pm") {
    return /tp260424-06b_01\.pdf#page=(\d+)/
  }
  return undefined
}

function extractSourceExplanationPage(
  sourceExplanation: string | undefined,
  year: number,
  session: ExamSession
) {
  if (!sourceExplanation) return undefined
  const pattern = examPdfUrlPattern(year, session)
  if (!pattern) return undefined
  const match = sourceExplanation.match(pattern)
  return match ? Number(match[1]) : undefined
}

function collectImplementedQuestionNumbers(year: number, session: ExamSession) {
  const numbers = new Set<number>()
  for (const { data } of parseQuestionJsonFiles()) {
    const mapsTo = data.mapsTo
    if (mapsTo?.year !== year || mapsTo.session !== session || !mapsTo.number) {
      continue
    }
    numbers.add(mapsTo.number)
  }
  return numbers
}

function verifyRegisteredPagesAgainstPdf(
  year: number,
  session: ExamSession,
  pdfPath: string,
  failures: Failure[]
) {
  const ranges = examPdfPageRangesFor(year, session)
  if (!ranges) return Promise.resolve()

  const absolutePath = resolveLocalPdf(pdfPath)
  if (!fs.existsSync(absolutePath)) {
    console.warn(
      `[skip] ローカル PDF なし: ${pdfPath}（JSON リンク検証のみ実行）`
    )
    return Promise.resolve()
  }

  return analyzePdfPages(pdfPath).then((pages) => {
    const label = `${year} ${session.toUpperCase()}`
    const detectedPages = questionPageMapFromPdf(pages)
    const implementedNumbers = collectImplementedQuestionNumbers(year, session)
    const registeredNumbers = registeredExamQuestionNumbers(ranges).filter(
      (questionNumber) => implementedNumbers.has(questionNumber)
    )

    const footerSamples = pages
      .filter((page) => page.footerLabel)
      .slice(0, 3)
      .map((page) => `${page.pageNumber}→${page.footerLabel}`)
    if (footerSamples.length > 0) {
      console.log(
        `[info] ${label} フッター例: ${footerSamples.join(", ")} …（PDF ページ番号 ≠ 後H-N を混同しない）`
      )
    }

    if (detectedPages.size === 0) {
      console.warn(
        `[skip] ${label} ${path.basename(pdfPath)}: 問題文がテキスト化されていないため問番号の自動照合をスキップ`
      )
      return
    }

    for (const questionNumber of registeredNumbers) {
      const registeredPage = officialExamPdfPage(year, session, questionNumber)
      const detectedPage = detectedPages.get(questionNumber)

      if (registeredPage === undefined) continue

      if (detectedPage === undefined) {
        failures.push({
          kind: "pdf-page",
          message: `${label} 問${questionNumber}: PDF 内に問番号が見つかりません（登録 page=${registeredPage}）`,
        })
        continue
      }

      if (detectedPage !== registeredPage) {
        failures.push({
          kind: "pdf-page",
          message: `${label} 問${questionNumber}: exam-pdfs 登録=${registeredPage} ページ / PDF 検出=${detectedPage} ページ`,
        })
      }
    }

    console.log(
      `[ok] ${label} PDF ${path.basename(pdfPath)}: ${registeredNumbers.length} 問を PDF テキストと照合`
    )
  })
}

function verifyQuestionJsonLinks(failures: Failure[]) {
  let checked = 0
  let missing = 0

  for (const { name, data } of parseQuestionJsonFiles()) {
    const mapsTo = data.mapsTo
    if (!mapsTo?.year || !mapsTo.session || !mapsTo.number) continue

    const expectedPage = officialExamPdfPage(
      mapsTo.year,
      mapsTo.session,
      mapsTo.number
    )
    if (expectedPage === undefined) continue

    const linkedPage = extractSourceExplanationPage(
      data.sourceExplanation,
      mapsTo.year,
      mapsTo.session
    )
    const label = `${mapsTo.year} ${mapsTo.session.toUpperCase()} 問${mapsTo.number} (${name})`

    if (linkedPage === undefined) {
      missing += 1
      continue
    }

    checked += 1
    if (linkedPage !== expectedPage) {
      failures.push({
        kind: "json-link",
        message: `${label}: sourceExplanation page=${linkedPage} / exam-pdfs page=${expectedPage}`,
      })
    }
  }

  console.log(
    `[ok] 問題 JSON の sourceExplanation リンク: ${checked} 件照合` +
      (missing > 0 ? `（#page= 未記載 ${missing} 件はスキップ）` : "")
  )
}

async function main() {
  const failures: Failure[] = []

  for (const [yearText, sessions] of Object.entries(localExamPdfPaths)) {
    const year = Number(yearText)
    for (const [session, pdfPath] of Object.entries(sessions)) {
      if (!pdfPath) continue
      await verifyRegisteredPagesAgainstPdf(
        year,
        session as ExamSession,
        pdfPath,
        failures
      )
    }
  }

  verifyQuestionJsonLinks(failures)

  if (failures.length === 0) {
    console.log("\nverify:exam-pages 成功")
    return
  }

  console.error(`\nverify:exam-pages 失敗 (${failures.length} 件):\n`)
  for (const failure of failures) {
    console.error(`- [${failure.kind}] ${failure.message}`)
  }
  process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
