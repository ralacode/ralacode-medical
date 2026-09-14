/**
 * 既存の問題 JSON と exam-data.ts から、年次マニフェストを逆生成する。
 *
 * 用法:
 *   pnpm exam:manifest --year 2026
 *
 * 出力: src/data/exam-manifests/{year}.json
 * 科目ブランチはこのファイルを編集せず、JSON の subject をマニフェストに合わせる。
 */
import fs from "node:fs"
import path from "node:path"
import { examYearData } from "../src/lib/exam-data.ts"
import {
  isExamSubjectId,
  isStudyTopicId,
  type StudyTopicId,
} from "../src/lib/exam-subjects.ts"
import type { ExamManifestSlot, ExamSlotKind, ExamYearManifest } from "../src/lib/exam-manifest.ts"
import {
  manifestsDir,
  parseQuestionJsonFiles,
  type QuestionFile,
} from "./lib/question-json.ts"

function parseArgs(argv: string[]) {
  let year: number | undefined
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!
    if (arg === "--year") year = Number(argv[++i])
    else if (arg.startsWith("--year=")) year = Number(arg.slice("--year=".length))
    else throw new Error(`不明な引数: ${arg}`)
  }
  if (!Number.isInteger(year)) {
    throw new Error("--year には西暦（例: 2026）を指定してください")
  }
  return { year: year! }
}

function topicFrom(sourceExplanation: string | undefined, stem: string) {
  const plain = (sourceExplanation ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim()
  const match = plain.match(/この問は[、,]?\s*(.+?)(?:です|を扱)/)
  const raw = match?.[1] ?? stem.replace(/\*\*/g, "").replace(/\s+/g, " ").trim()
  return raw.replace(/[（(]公式 PDF.*$/, "").trim().slice(0, 80)
}

function inferKind(file: QuestionFile): ExamSlotKind {
  const source = file.data.sourceExplanation ?? ""
  const numbered = new Set(
    [...source.matchAll(/\*\*([1-5]) 番\*\*/g)].map((match) => match[1])
  )
  if (numbered.size >= 5) return "knowledge"
  const explained = file.data.choices.filter((choice) =>
    (choice.explanation ?? "").trim()
  ).length
  if (explained >= 5) return "knowledge"
  return "calculation"
}

function slotFromFile(
  file: QuestionFile,
  hasBooklet: boolean
): ExamManifestSlot {
  const { data } = file
  if (!isExamSubjectId(data.subject)) {
    throw new Error(`${file.name}: 未知の科目 ID ${data.subject}`)
  }
  const studyTopics = (data.studyTopics ?? []).filter(isStudyTopicId) as StudyTopicId[]
  const scoringExcluded = data.mapsTo.scoringExcluded === true
  return {
    session: data.session,
    number: data.number,
    subject: data.subject,
    studyTopics,
    officialAnswer: scoringExcluded ? null : (data.mapsTo.answer ?? null),
    scoringExcluded,
    hasBooklet,
    kind: inferKind(file),
    topic: topicFrom(data.sourceExplanation, data.stem),
  }
}

function main() {
  const { year } = parseArgs(process.argv.slice(2))
  const yearData = examYearData(year)
  if (!yearData) {
    throw new Error(`src/lib/exam-data.ts に ${year} 年がありません`)
  }

  const files = parseQuestionJsonFiles().filter(
    (file) => file.data.year === year || file.data.mapsTo.year === year
  )
  if (files.length === 0) {
    throw new Error(`${year} 年の問題 JSON がありません`)
  }

  const slots = files
    .map((file) => {
      const session = file.data.session
      const number = file.data.number
      const hasBooklet = yearData.bookletPages[session][number] !== undefined
      return slotFromFile(file, hasBooklet)
    })
    .sort((a, b) => {
      if (a.session !== b.session) return a.session.localeCompare(b.session)
      return a.number - b.number
    })

  const manifest: ExamYearManifest = {
    year,
    exam: yearData.exam,
    slots,
  }

  fs.mkdirSync(manifestsDir, { recursive: true })
  const outPath = path.join(manifestsDir, `${year}.json`)
  fs.writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`${outPath}（${slots.length} スロット）`)
}

main()
