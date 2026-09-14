/**
 * src/lib/exam-data.ts のページ表と、問題 JSON の sourceExplanation リンクが一致するか検証する。
 * ローカル PDF がある場合は、各ページのフッター（前H-N / 後H-N）も表示し、
 * 問題文がテキスト化されている PDF では問番号の自動照合も行う（scripts/lib/exam-pdf.ts を使用）。
 *
 * 用法:
 *   pnpm verify:exam-pages
 *   pnpm verify:exam-pages --strict   ローカル PDF が無いときも失敗にする（Cloud / CI 用）
 *
 * 前提: exams/{year}/{year}-{exam}th-{am,pm}.pdf（gitignore、任意。無ければ pnpm exam:fetch-pdfs）
 */
import fs from "node:fs"
import path from "node:path"
import {
  examData,
  examPdfUrl,
  localExamPdfPath,
  officialExamPdfPage,
  registeredExamQuestionNumbersFor,
} from "../src/lib/exam-data.ts"
import { isGrandfatherYear } from "../src/lib/exam-manifest.ts"
import {
  assignQuestionPages,
  loadExamPdf,
  readAllExamPdfPages,
  repoRoot,
} from "./lib/exam-pdf.ts"
import { parseQuestionJsonFiles } from "./lib/question-json.ts"

type ExamSession = "am" | "pm"

type Failure = {
  kind: "pdf-page" | "json-link" | "pdf-missing"
  message: string
}

function parseArgs(argv: string[]) {
  let strict = false
  for (const arg of argv) {
    if (arg === "--strict") strict = true
    else throw new Error(`不明な引数: ${arg}`)
  }
  return { strict }
}

/** examPdfUrl の公式 URL から「その URL に #page=N が付いたリンク」を検出する正規表現を作る */
function examPdfUrlPattern(year: number, session: ExamSession) {
  const url = examPdfUrl(year, session)
  if (!url) return undefined
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`${escaped}#page=(\\d+)`)
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

async function verifyRegisteredPagesAgainstPdf(
  year: number,
  session: ExamSession,
  failures: Failure[],
  strict: boolean
) {
  const relativePath = localExamPdfPath(year, session)
  if (!relativePath) return

  const absolutePath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(absolutePath)) {
    const message = `ローカル PDF なし: ${relativePath}（JSON リンク検証のみ実行）`
    if (strict) {
      failures.push({ kind: "pdf-missing", message })
    } else {
      console.warn(`[skip] ${message}`)
    }
    return
  }

  const label = `${year} ${session.toUpperCase()}`
  const document = await loadExamPdf(absolutePath)
  const pages = await readAllExamPdfPages(document)
  const detectedPages = assignQuestionPages(pages)
  const implementedNumbers = collectImplementedQuestionNumbers(year, session)
  const registeredNumbers = registeredExamQuestionNumbersFor(
    year,
    session
  ).filter((questionNumber) => implementedNumbers.has(questionNumber))

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
      `[skip] ${label} ${path.basename(relativePath)}: 問題文がテキスト化されていないため問番号の自動照合をスキップ`
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
        message: `${label} 問${questionNumber}: exam-data 登録=${registeredPage} ページ / PDF 検出=${detectedPage} ページ`,
      })
    }
  }

  console.log(
    `[ok] ${label} PDF ${path.basename(relativePath)}: ${registeredNumbers.length} 問を PDF テキストと照合`
  )
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
      if (isGrandfatherYear(mapsTo.year)) {
        missing += 1
        continue
      }
      failures.push({
        kind: "json-link",
        message: `${label}: sourceExplanation に #page= がありません（exam-data page=${expectedPage}）`,
      })
      continue
    }

    checked += 1
    if (linkedPage !== expectedPage) {
      failures.push({
        kind: "json-link",
        message: `${label}: sourceExplanation page=${linkedPage} / exam-data page=${expectedPage}`,
      })
    }
  }

  console.log(
    `[ok] 問題 JSON の sourceExplanation リンク: ${checked} 件照合` +
      (missing > 0 ? `（祖父化年の #page= 未記載 ${missing} 件はスキップ）` : "")
  )
}

async function main() {
  const { strict } = parseArgs(process.argv.slice(2))
  const failures: Failure[] = []

  for (const yearText of Object.keys(examData)) {
    const year = Number(yearText)
    for (const session of ["am", "pm"] as const) {
      await verifyRegisteredPagesAgainstPdf(year, session, failures, strict)
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
