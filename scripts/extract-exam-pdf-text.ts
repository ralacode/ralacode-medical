/**
 * 公式 PDF（exams/ のローカル原本）のテキストをページ単位で標準出力に出す。
 * 出題の論点・肢のテーマ・公式正答を把握するための閲覧用。
 *
 * 用法:
 *   pnpm exam:pdf-text 2026 am --pages 5-7        PDF 5〜7 ページ（1 始まりの PDF ページ番号）
 *   pnpm exam:pdf-text 2026 pm --question 13      問 13 の見出しがあるページを探して表示
 *   pnpm exam:pdf-text 2026 answers               正答表（全ページ）
 *   pnpm exam:pdf-text exams/2026/2026-78th-am.pdf --pages 5
 *   pnpm exam:pdf-text 2026 am --toc              各ページの問番号とフッターだけ一覧
 *
 * 注意: 出力された公式の問題文・選択肢を JSON・PR・チャットに転載しないこと
 * （docs/exam-question-authoring.md「絶対に守ること」1）。
 */
import {
  assignQuestionPages,
  loadExamPdf,
  parsePageSpec,
  readAllExamPdfPages,
  resolveExamPdf,
} from "./lib/exam-pdf.ts"

type Args = {
  positional: string[]
  pages?: string
  question?: number
  toc: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = { positional: [], toc: false }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!
    if (arg === "--pages") {
      args.pages = argv[++i]
    } else if (arg.startsWith("--pages=")) {
      args.pages = arg.slice("--pages=".length)
    } else if (arg === "--question") {
      args.question = Number(argv[++i])
    } else if (arg.startsWith("--question=")) {
      args.question = Number(arg.slice("--question=".length))
    } else if (arg === "--toc") {
      args.toc = true
    } else if (arg.startsWith("--")) {
      throw new Error(`不明なオプション: ${arg}`)
    } else {
      args.positional.push(arg)
    }
  }
  if (args.question !== undefined && !Number.isInteger(args.question)) {
    throw new Error("--question には問番号（整数）を指定してください")
  }
  return args
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const { absolutePath, label } = resolveExamPdf(args.positional)
  const document = await loadExamPdf(absolutePath)

  console.log(`# ${label}（全 ${document.numPages} ページ。ページ番号は PDF の 1 始まり）`)
  console.log(
    "# 注意: 公式の問題文・選択肢をリポジトリ・PR・チャットに転載しない\n"
  )

  const pages = await readAllExamPdfPages(document)
  const questionPages = assignQuestionPages(pages)
  const questionsOnPage = (pageNumber: number) =>
    [...questionPages.entries()]
      .filter(([, page]) => page === pageNumber)
      .map(([question]) => question)
      .sort((a, b) => a - b)

  if (args.toc) {
    for (const info of pages) {
      const footer = info.footerLabel ? ` footer=${info.footerLabel}` : ""
      const questions = questionsOnPage(info.pageNumber)
      const label = questions.length > 0 ? ` 問${questions.join(",")}` : ""
      console.log(`page ${String(info.pageNumber).padStart(3)}:${footer}${label}`)
    }
    return
  }

  let targetPages: number[]
  if (args.question !== undefined) {
    const page = questionPages.get(args.question)
    if (page === undefined) {
      throw new Error(
        `問 ${args.question} の見出しが見つかりません（--toc で検出状況を確認し、--pages で直接指定するか exam:pdf-render で描画してください）`
      )
    }
    targetPages = [page]
  } else if (args.pages) {
    targetPages = parsePageSpec(args.pages, document.numPages)
  } else {
    targetPages = pages.map((info) => info.pageNumber)
  }

  for (const pageNumber of targetPages) {
    const info = pages[pageNumber - 1]!
    const footer = info.footerLabel ? `、フッター ${info.footerLabel}` : ""
    const questions = questionsOnPage(pageNumber)
    const label = questions.length > 0 ? `、問 ${questions.join(", ")}` : ""
    console.log(`=== PDF ${pageNumber} ページ${footer}${label} ===`)
    console.log(info.readable || "（テキストなし。画像のみのページ）")
    console.log()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
