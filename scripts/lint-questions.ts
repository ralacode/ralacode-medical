/**
 * 問題 JSON のゲート検査。形式チェック（1〜5 番・#page=）は祖父化年（2026）を免除する。
 *
 * 用法:
 *   pnpm lint:questions
 *   pnpm lint:questions --report-format   祖父化年にも形式チェックをかけ、件数だけ出す（失敗にはしない）
 */
import {
  examPdfUrl,
  officialExamPdfPage,
} from "../src/lib/exam-data.ts"
import { examSubjectIds } from "../src/lib/exam-subjects.ts"
import {
  indexManifestSlots,
  isGrandfatherYear,
  manifestSlotKey,
} from "../src/lib/exam-manifest.ts"
import {
  expectedQuestionFileName,
  loadYearManifest,
  officialAnswerEquals,
  parseQuestionJsonFiles,
  type QuestionFile,
} from "./lib/question-json.ts"

type Failure = {
  file: string
  message: string
}

type Args = {
  reportFormat: boolean
}

function parseArgs(argv: string[]): Args {
  let reportFormat = false
  for (const arg of argv) {
    if (arg === "--report-format") reportFormat = true
    else throw new Error(`不明な引数: ${arg}`)
  }
  return { reportFormat }
}

function isSingleAnswer(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5
}

function collectHrefAttributes(html: string) {
  const tags: { href: string; attrs: string }[] = []
  const pattern = /<a\b([^>]*)>/gi
  for (const match of html.matchAll(pattern)) {
    const attrs = match[1] ?? ""
    const href = attrs.match(/\bhref\s*=\s*"([^"]+)"/i)?.[1]
    if (href) tags.push({ href, attrs })
  }
  return tags
}

function hasBlankTarget(attrs: string) {
  return /\btarget\s*=\s*"_blank"/i.test(attrs)
}

function hasNoopener(attrs: string) {
  const rel = attrs.match(/\brel\s*=\s*"([^"]+)"/i)?.[1] ?? ""
  const tokens = new Set(rel.split(/\s+/).filter(Boolean))
  return tokens.has("noopener") && tokens.has("noreferrer")
}

function forbiddenWording(text: string): string[] {
  const found: string[] = []
  if (text.includes("アーティファクト")) found.push("アーティファクト（アーチファクトを使う）")
  // CT/MRI の断面表記。単純な「軸位」は撮影法名（Towne 法の軸位など）で使うことがある
  if (/軸位[像断]/.test(text) || /軸位で/.test(text)) {
    found.push("軸位像・軸位断・軸位で（横断像を使う）")
  }
  const withoutJobTitle = text.replaceAll("診療放射線技師", "")
  if (withoutJobTitle.includes("放射線技師") || withoutJobTitle.includes("RT 技師")) {
    found.push("放射線技師 / RT 技師（診療放射線技師と書く）")
  }
  return found
}

function parseLimbLabels(sourceExplanation: string) {
  const labels = new Map<number, "正解" | "誤り" | "unknown">()
  const pattern =
    /\*\*([1-5]) 番\*\*[\s\S]*?(?=-\s*\*\*[1-5] 番\*\*|$)/g
  for (const match of sourceExplanation.matchAll(pattern)) {
    const number = Number(match[1])
    const block = match[0]
    const isCorrect = /\*\*正解\*\*/.test(block)
    const isWrong = /\*\*誤り\*\*/.test(block)
    labels.set(
      number,
      isCorrect ? "正解" : isWrong ? "誤り" : "unknown"
    )
  }
  return labels
}

function correctNumbers(labels: Map<number, "正解" | "誤り" | "unknown">) {
  return [...labels.entries()]
    .filter(([, status]) => status === "正解")
    .map(([number]) => number)
    .sort((a, b) => a - b)
}

function expectedCorrectNumbers(answer: number | number[] | undefined) {
  if (answer === undefined) return []
  return (Array.isArray(answer) ? [...answer] : [answer]).sort((a, b) => a - b)
}

function allText(file: QuestionFile) {
  const { data } = file
  return [
    data.stem,
    ...data.choices.map((choice) => `${choice.text}\n${choice.explanation ?? ""}`),
    data.sourceExplanation ?? "",
  ].join("\n")
}

function lintGate(file: QuestionFile, failures: Failure[]) {
  const { name, data } = file
  const fail = (message: string) => failures.push({ file: name, message })

  const expectedName = expectedQuestionFileName(data)
  if (name !== expectedName) {
    fail(`ファイル名が ${expectedName} であるべきです`)
  }

  const mapsTo = data.mapsTo
  if (!mapsTo) {
    fail("mapsTo がありません")
    return
  }

  if (
    mapsTo.year !== data.year ||
    mapsTo.exam !== data.exam ||
    mapsTo.session !== data.session ||
    mapsTo.number !== data.number
  ) {
    fail(
      `mapsTo（${mapsTo.year}/${mapsTo.exam}/${mapsTo.session}/${mapsTo.number}）が year/exam/session/number と一致しません`
    )
  }

  if (data.origin !== "analog") {
    fail(`origin は analog であるべきです（${data.origin}）`)
  }

  if (!Array.isArray(data.choices) || data.choices.length !== 5) {
    fail(`choices は 5 つ必要です（${data.choices?.length ?? 0}）`)
  } else {
    for (const [index, choice] of data.choices.entries()) {
      if (!choice.text?.trim()) fail(`肢 ${index + 1} の text が空です`)
    }
  }

  if (!isSingleAnswer(data.answer)) {
    fail("類似問題の answer は 1〜5 の単一の数である必要があります")
  }

  if (!(examSubjectIds as readonly string[]).includes(data.subject)) {
    fail(`未知の科目 ID: ${data.subject}`)
  }

  const published = data.draft !== true
  if (published && !data.sourceExplanation?.trim()) {
    fail("draft: false なのに sourceExplanation がありません")
  }

  const html = allText(file)
  if (/<\/?sub>/i.test(html) || /<\/?sup>/i.test(html)) {
    fail("<sub> / <sup> は使わず Unicode で書いてください")
  }
  for (const wording of forbiddenWording(html)) {
    fail(`禁止表記: ${wording}`)
  }

  for (const tag of collectHrefAttributes(html)) {
    if (!hasBlankTarget(tag.attrs) || !hasNoopener(tag.attrs)) {
      fail(`リンク ${tag.href} に target="_blank" rel="noopener noreferrer" がありません`)
    }
  }

  const manifest = loadYearManifest(data.year)
  if (!manifest) {
    fail(`src/data/exam-manifests/${data.year}.json がありません`)
    return
  }
  if (manifest.exam !== data.exam) {
    fail(`マニフェストの回次 ${manifest.exam} と JSON の exam ${data.exam} が違います`)
  }
  const slot = indexManifestSlots(manifest).get(
    manifestSlotKey(data.session, data.number)
  )
  if (!slot) {
    fail(`マニフェストに ${data.session} 問${data.number} がありません`)
    return
  }
  if (slot.subject !== data.subject) {
    fail(`科目がマニフェスト（${slot.subject}）と違います（JSON: ${data.subject}）`)
  }
  const jsonTopics = [...(data.studyTopics ?? [])].sort()
  const slotTopics = [...slot.studyTopics].sort()
  if (jsonTopics.join(",") !== slotTopics.join(",")) {
    fail(
      `studyTopics がマニフェスト（[${slotTopics.join(", ")}]）と違います`
    )
  }
  if (
    !officialAnswerEquals(mapsTo, slot.officialAnswer, slot.scoringExcluded)
  ) {
    fail("mapsTo の公式正答 / 採点除外がマニフェストと一致しません")
  }
}

function lintFormat(file: QuestionFile, failures: Failure[]) {
  const { name, data } = file
  const fail = (message: string) => failures.push({ file: name, message })
  const published = data.draft !== true
  const source = data.sourceExplanation ?? ""
  const manifest = loadYearManifest(data.year)
  const slot = manifest
    ? indexManifestSlots(manifest).get(manifestSlotKey(data.session, data.number))
    : undefined
  const kind = slot?.kind ?? "knowledge"

  if (published && kind === "knowledge") {
    const unexplained = data.choices
      .map((choice, index) =>
        (choice.explanation ?? "").trim() ? undefined : index + 1
      )
      .filter((value): value is number => value !== undefined)
    if (unexplained.length > 0) {
      fail(`知識問題なのに explanation が空の肢があります: ${unexplained.join(", ")}`)
    }
  }

  if (published && kind === "knowledge") {
    const labels = parseLimbLabels(source)
    for (const number of [1, 2, 3, 4, 5]) {
      if (!labels.has(number)) {
        fail(`sourceExplanation に **${number} 番** がありません`)
        continue
      }
      if (labels.get(number) === "unknown") {
        fail(`**${number} 番** に 正解 / 誤り ラベルがありません`)
      }
    }
    if (!slot?.scoringExcluded) {
      const got = correctNumbers(labels)
      const expected = expectedCorrectNumbers(data.mapsTo.answer)
      if (got.join(",") !== expected.join(",")) {
        fail(
          `sourceExplanation の正解ラベル [${got.join(", ")}] が mapsTo.answer [${expected.join(", ")}] と一致しません`
        )
      }
    }
  }

  if (published) {
    const expectedPage = officialExamPdfPage(data.year, data.session, data.number)
    const href = examPdfUrl(data.year, data.session)
    if (expectedPage !== undefined && href) {
      const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const match = source.match(new RegExp(`${escaped}#page=(\\d+)`))
      if (!match) {
        fail("sourceExplanation に公式 PDF の #page=N リンクがありません")
      } else if (Number(match[1]) !== expectedPage) {
        fail(
          `sourceExplanation の #page=${match[1]} が exam-data（${expectedPage}）と違います`
        )
      }
    }
  }
}

function main() {
  const { reportFormat } = parseArgs(process.argv.slice(2))
  const files = parseQuestionJsonFiles()
  const gateFailures: Failure[] = []
  const formatFailures: Failure[] = []
  const formatReport: Failure[] = []

  for (const file of files) {
    lintGate(file, gateFailures)
    if (isGrandfatherYear(file.data.year)) {
      lintFormat(file, formatReport)
    } else {
      lintFormat(file, formatFailures)
    }
  }

  console.log(
    `[ok] lint:questions ゲート ${files.length} 件` +
      (gateFailures.length > 0 ? ` / 失敗 ${gateFailures.length}` : "")
  )
  if (formatFailures.length > 0) {
    console.log(`[ok] 形式チェック 失敗 ${formatFailures.length} 件`)
  }
  if (reportFormat) {
    const uniqueFiles = new Set(formatReport.map((failure) => failure.file))
    console.log(
      `[info] 祖父化年の形式チェック（参考・失敗にしない）: ${formatReport.length} 件 / ${uniqueFiles.size} ファイル`
    )
    const byMessage = new Map<string, number>()
    for (const failure of formatReport) {
      const key = failure.message.replace(/: .+$/, "")
      byMessage.set(key, (byMessage.get(key) ?? 0) + 1)
    }
    for (const [message, count] of [...byMessage.entries()].sort(
      (a, b) => b[1] - a[1]
    )) {
      console.log(`  - ${count} 件: ${message}`)
    }
  }

  const failures = [...gateFailures, ...formatFailures]
  if (failures.length === 0) {
    console.log("\nlint:questions 成功")
    return
  }

  console.error(`\nlint:questions 失敗 (${failures.length} 件):\n`)
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.message}`)
  }
  process.exitCode = 1
}

main()
