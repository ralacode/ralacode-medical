/**
 * 類似問題の作業リスト。マニフェストのスロットのうち JSON がまだ無いものを、
 * docs/cloud-subject-prompt.md の「塊の決め方」で塊にして出す。
 *
 * 用法:
 *   pnpm exam:next-chunk                 # 次の 1 塊（人が読む形）
 *   pnpm exam:next-chunk --all           # 残りの塊すべて
 *   pnpm exam:next-chunk --json          # 機械向け（--all と併用可）
 *   pnpm exam:next-chunk --skip KEY,KEY  # 予約済み（open PR がある）塊を飛ばす
 *
 * 塊の KEY は `2023-75th-pm-070-074` の形。PR タイトルの先頭 `[q:KEY]` と同じ。
 * 公式 PDF は読まない。マニフェストと既存 JSON だけを見る。
 */
import fs from "node:fs"
import type { ExamManifestSlot } from "../src/lib/exam-manifest.ts"
import { examSubjectLabels, studyTopicLabels } from "../src/lib/exam-subjects.ts"
import {
  expectedQuestionFileName,
  loadYearManifest,
  manifestsDir,
  parseQuestionJsonFiles,
} from "./lib/question-json.ts"

const maxChunkSize = 12
const targetChunkSize = 10

type Chunk = {
  key: string
  year: number
  exam: number
  session: "am" | "pm"
  subject: string
  subjectLabel: string
  from: number
  to: number
  split: boolean
  branch: string
  files: string[]
  existingInSubject: number[]
  slots: ExamManifestSlot[]
}

function parseArgs(argv: string[]) {
  let all = false
  let json = false
  const skip = new Set<string>()
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!
    if (arg === "--all") all = true
    else if (arg === "--json") json = true
    else if (arg === "--skip" || arg.startsWith("--skip=")) {
      const value = arg === "--skip" ? argv[++i] ?? "" : arg.slice("--skip=".length)
      for (const key of value.split(",")) if (key.trim()) skip.add(key.trim())
    } else throw new Error(`不明な引数: ${arg}`)
  }
  return { all, json, skip }
}

/** 連続した番号・同じ科目のスロットを 1 グループにする */
function groupRuns(slots: ExamManifestSlot[], same: (a: ExamManifestSlot, b: ExamManifestSlot) => boolean) {
  const groups: ExamManifestSlot[][] = []
  for (const slot of slots) {
    const last = groups.at(-1)
    const prev = last?.at(-1)
    if (last && prev && prev.number + 1 === slot.number && same(prev, slot)) last.push(slot)
    else groups.push([slot])
  }
  return groups
}

function evenSplit(slots: ExamManifestSlot[]) {
  const parts = Math.ceil(slots.length / targetChunkSize)
  const size = Math.ceil(slots.length / parts)
  const out: ExamManifestSlot[][] = []
  for (let i = 0; i < slots.length; i += size) out.push(slots.slice(i, i + size))
  return out
}

/** 12 問を超える塊は、学習タグの切れ目で分け、まだ大きければ 10 問前後に分ける */
function splitLarge(run: ExamManifestSlot[]) {
  if (run.length <= maxChunkSize) return [run]
  const byTopic = groupRuns(run, (a, b) => a.studyTopics.join(",") === b.studyTopics.join(","))
  const parts = byTopic.length > 1 ? byTopic : [run]
  return parts.flatMap((part) => (part.length > maxChunkSize ? evenSplit(part) : [part]))
}

const pad = (n: number) => String(n).padStart(3, "0")

function buildChunks(): Chunk[] {
  const existing = new Set(parseQuestionJsonFiles().map((file) => file.name))
  const years = fs
    .readdirSync(manifestsDir)
    .map((name) => /^(\d{4})\.json$/.exec(name)?.[1])
    .filter((y): y is string => Boolean(y))
    .map(Number)
    .sort((a, b) => b - a)

  const chunks: Chunk[] = []
  for (const year of years) {
    const manifest = loadYearManifest(year)
    if (!manifest) continue
    const { exam } = manifest
    for (const session of ["am", "pm"] as const) {
      const sessionSlots = manifest.slots
        .filter((slot) => slot.session === session)
        .sort((a, b) => a.number - b.number)
      const fileOf = (slot: ExamManifestSlot) =>
        expectedQuestionFileName({ year, exam, session, number: slot.number })
      const missing = sessionSlots.filter((slot) => !existing.has(fileOf(slot)))
      for (const run of groupRuns(missing, (a, b) => a.subject === b.subject)) {
        const parts = splitLarge(run)
        for (const part of parts) {
          const first = part[0]!
          const last = part.at(-1)!
          const subject = first.subject
          const split = parts.length > 1 || part.length !== run.length
          // 同じ年の別セッション・別の塊で同じ科目のブランチが既に使われていることがある
          const subjectHasOthers = manifest.slots.some(
            (slot) =>
              slot.subject === subject &&
              (slot.session !== session || existing.has(fileOf(slot)))
          )
          const branch =
            split || subjectHasOthers
              ? `q/${year}-${exam}th/${subject}-${session}-${first.number}-${last.number}`
              : `q/${year}-${exam}th/${subject}`
          chunks.push({
            key: `${year}-${exam}th-${session}-${pad(first.number)}-${pad(last.number)}`,
            year,
            exam,
            session,
            subject,
            subjectLabel: examSubjectLabels[subject],
            from: first.number,
            to: last.number,
            split,
            branch,
            files: part.map((slot) => `src/content/questions/${fileOf(slot)}`),
            existingInSubject: sessionSlots
              .filter((slot) => slot.subject === subject && existing.has(fileOf(slot)))
              .map((slot) => slot.number),
            slots: part,
          })
        }
      }
    }
  }
  return chunks
}

function slotNotes(slot: ExamManifestSlot) {
  const notes: string[] = []
  if (Array.isArray(slot.officialAnswer)) notes.push(`公式は複数正解 ${slot.officialAnswer.join(",")}`)
  if (slot.hasBooklet) notes.push("別冊あり")
  if (slot.kind === "calculation") notes.push("計算")
  if (slot.scoringExcluded) notes.push("採点除外")
  const topics = slot.studyTopics.map((id) => `${id}（${studyTopicLabels[id]}）`)
  return [...topics, ...notes].join(" / ")
}

function printChunk(chunk: Chunk) {
  const session = chunk.session === "am" ? "午前" : "午後"
  console.log(`[q:${chunk.key}] ${chunk.year}年（第${chunk.exam}回）${session} 問${chunk.from}〜問${chunk.to}`)
  console.log(`  科目: ${chunk.subject}（${chunk.subjectLabel}）${chunk.split ? " ※科目は同じ、塊だけ分けた" : ""}`)
  console.log(`  ブランチ案: ${chunk.branch}`)
  if (chunk.existingInSubject.length > 0) {
    console.log(`  同じ科目で既にある問（触らない）: ${chunk.existingInSubject.join(", ")}`)
  }
  for (const slot of chunk.slots) {
    const notes = slotNotes(slot)
    console.log(`  - 問${slot.number}${notes ? `: ${notes}` : ""}`)
  }
}

const { all, json, skip } = parseArgs(process.argv.slice(2))
const chunks = buildChunks().filter((chunk) => !skip.has(chunk.key))
const selected = all ? chunks : chunks.slice(0, 1)

if (json) {
  console.log(JSON.stringify(selected, null, 2))
} else if (selected.length === 0) {
  console.log("作業リストは空です。マニフェストのある年の類似問題は、予約済みを除いてすべて揃っています。")
} else {
  for (const chunk of selected) printChunk(chunk)
  if (!all && chunks.length > 1) console.log(`\n残り ${chunks.length} 塊（--all で一覧）`)
}
