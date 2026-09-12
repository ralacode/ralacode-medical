/**
 * 厚生労働省の公式 PDF を exams/{year}/（gitignore）にダウンロードする。
 *
 * 用法:
 *   pnpm exam:fetch-pdfs              すべての年次。既存ファイルはスキップ（冪等）
 *   pnpm exam:fetch-pdfs --year 2026  指定年次だけ
 *   pnpm exam:fetch-pdfs --force      既存ファイルも上書き
 *
 * Cloud Agent では .cursor/environment.json の install / start から呼ばれる。
 * ダウンロードした PDF はリポジトリに入れない（/exams/ は gitignore 済み）。
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { localExamPdfPaths } from "../src/lib/exam-pdf-page-ranges.ts"
import {
  examPdfKinds,
  examPdfSources,
  localExamPdfPath,
} from "./exam-pdf-sources.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")

function parseArgs(argv: string[]) {
  let year: number | undefined
  let force = false
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === "--force") force = true
    else if (arg === "--year") {
      year = Number(argv[i + 1])
      i += 1
    } else if (arg.startsWith("--year=")) {
      year = Number(arg.slice("--year=".length))
    } else {
      throw new Error(`不明な引数: ${arg}`)
    }
  }
  if (year !== undefined && !Number.isInteger(year)) {
    throw new Error("--year には西暦（例: 2026）を指定してください")
  }
  return { year, force }
}

/** exam-pdf-page-ranges.ts の localExamPdfPaths と保存先が食い違っていないか */
function checkConsistencyWithPageRanges(year: number) {
  const registered = localExamPdfPaths[year]
  if (!registered) return
  for (const session of ["am", "pm"] as const) {
    const expected = registered[session]
    const actual = localExamPdfPath(year, session)
    if (expected && actual && expected !== actual) {
      console.warn(
        `[warn] ${year} ${session}: exam-pdf-page-ranges.ts は ${expected}、exam-pdf-sources.ts は ${actual}。verify:exam-pages が PDF を見つけられません`
      )
    }
  }
}

async function download(url: string, destination: string) {
  const response = await fetch(url, {
    headers: { "user-agent": "ralacode-medical exam:fetch-pdfs" },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`)
  }
  const bytes = new Uint8Array(await response.arrayBuffer())
  const header = Buffer.from(bytes.subarray(0, 5)).toString("latin1")
  if (header !== "%PDF-") {
    throw new Error(`PDF ではない応答です（先頭: ${JSON.stringify(header)}）`)
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  const temporary = `${destination}.download`
  fs.writeFileSync(temporary, bytes)
  fs.renameSync(temporary, destination)
  return bytes.byteLength
}

async function main() {
  const { year: onlyYear, force } = parseArgs(process.argv.slice(2))

  const years = Object.keys(examPdfSources)
    .map(Number)
    .filter((year) => onlyYear === undefined || year === onlyYear)
  if (years.length === 0) {
    throw new Error(
      `exam-pdf-sources.ts に ${onlyYear ?? "（年次）"} のエントリがありません`
    )
  }

  let downloaded = 0
  let skipped = 0
  const failures: string[] = []

  for (const year of years) {
    checkConsistencyWithPageRanges(year)
    const { urls } = examPdfSources[year]!

    for (const kind of examPdfKinds) {
      const url = urls[kind]
      const relativePath = localExamPdfPath(year, kind)
      if (!url || !relativePath) continue

      const destination = path.join(repoRoot, relativePath)
      if (!force && fs.existsSync(destination)) {
        console.log(`[skip] ${relativePath}（既存）`)
        skipped += 1
        continue
      }

      try {
        const size = await download(url, destination)
        console.log(`[ok]   ${relativePath}（${(size / 1024).toFixed(0)} KB）`)
        downloaded += 1
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`[fail] ${relativePath} ← ${url}\n       ${message}`)
        failures.push(relativePath)
      }
    }
  }

  console.log(
    `\nexam:fetch-pdfs 取得 ${downloaded} 件 / スキップ ${skipped} 件 / 失敗 ${failures.length} 件`
  )
  if (failures.length > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
