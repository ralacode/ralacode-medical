/**
 * 問題 JSON と用語記事から、厚労省公式以外の <a href> / Markdown リンクを集める。
 *
 * 用法:
 *   pnpm exam:external-links           docs/external-links.md を生成
 *   pnpm exam:external-links --check   生成結果が既存ファイルと一致しなければ失敗
 */
import fs from "node:fs"
import path from "node:path"
import { examData } from "../src/lib/exam-data.ts"
import { parseQuestionJsonFiles } from "./lib/question-json.ts"
import { repoRoot } from "./lib/exam-pdf.ts"

const outPath = path.join(repoRoot, "docs/external-links.md")
const articlesDir = path.join(repoRoot, "src/content/articles")

type LinkHit = {
  url: string
  label: string
  source: string
}

function officialUrlSet() {
  const urls = new Set<string>()
  for (const year of Object.values(examData)) {
    for (const href of Object.values(year.pdfs)) {
      if (href) urls.add(stripHash(href))
    }
  }
  return urls
}

function stripHash(url: string) {
  return url.split("#")[0]!
}

function isOfficialUrl(url: string, official: Set<string>) {
  const base = stripHash(url)
  if (official.has(base)) return true
  try {
    const host = new URL(base).hostname
    return host === "www.mhlw.go.jp" || host.endsWith(".mhlw.go.jp")
  } catch {
    return false
  }
}

function decodeHref(href: string) {
  return href.replaceAll("&amp;", "&")
}

function collectFromHtml(text: string, source: string, hits: LinkHit[]) {
  const pattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi
  for (const match of text.matchAll(pattern)) {
    const attrs = match[1] ?? ""
    const href = attrs.match(/\bhref\s*=\s*"([^"]+)"/i)?.[1]
    if (!href || href.startsWith("/") || href.startsWith("#")) continue
    const label = match[2]!.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
    hits.push({ url: decodeHref(href), label, source })
  }
}

function collectFromMarkdown(text: string, source: string, hits: LinkHit[]) {
  const pattern = /\[([^\]]+)\]\((https?:[^)\s]+)\)/g
  for (const match of text.matchAll(pattern)) {
    hits.push({ url: decodeHref(match[2]!), label: match[1]!.trim(), source })
  }
}

function relativeSource(filePath: string) {
  return path.relative(repoRoot, filePath).replaceAll("\\", "/")
}

function previousCheckedDates() {
  const dates = new Map<string, string>()
  if (!fs.existsSync(outPath)) return dates
  const text = fs.readFileSync(outPath, "utf8")
  for (const line of text.split("\n")) {
    const match = line.match(
      /^\| (https?:\S+) \| .* \| .* \| .* \| (\d{4}-\d{2}-\d{2}) \|\s*$/
    )
    if (match) dates.set(match[1]!, match[2]!)
  }
  return dates
}

function renderMarkdown(hits: LinkHit[], checked: Map<string, string>) {
  const grouped = new Map<string, LinkHit[]>()
  for (const hit of hits) {
    const list = grouped.get(hit.url) ?? []
    list.push(hit)
    grouped.set(hit.url, list)
  }
  const rows = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))

  const table = rows
    .map(([url, list]) => {
      const label = list.find((item) => item.label)?.label || url
      const sources = [...new Set(list.map((item) => `\`${item.source}\``))].join(", ")
      const date = checked.get(url) ?? "—"
      return `| ${url} | ${label} | ${sources} | reference | ${date} |`
    })
    .join("\n")

  return `# 外部リンク台帳（参考リンク）

厚生労働省の**公式問題 PDF・公式通知 PDF** 以外で、コンテンツ内からリンクしている外部 URL の一覧です。リンク切れの定期確認用。

**このファイルは生成物です。手で編集しないでください。** \`pnpm exam:external-links\` が問題 JSON と用語記事から集めます。最終確認日だけ、既存行があれば引き継ぎます。

- **公式 PDF** … \`src/lib/exam-data.ts\` と \`pnpm verify:exam-pages\` で管理。本台帳には載せない。
- **本台帳** … 製薬メーカー・メーカー参考情報など、**参考目的の外部リンク**のみ。

---

## エージェント向け：リンク有効性の確認

ユーザーから「外部リンクの有効性を調べて」と依頼されたら、次を実行する。

1. 下表の **URL** それぞれに HTTP でアクセスする（\`curl -sI\` や \`fetch\` など）。
2. **200** または **3xx**（最終的にページが開く）なら OK。
3. **404 / 410** ならリンク切れ。参照元ファイルを修正し、\`pnpm exam:external-links\` で本表を再生成する。
4. **403** … ボット対策で CLI から拒否されることがある（Bayer pharma-navi 等）。その場合はブラウザで開けるか目視確認し、結果を報告に書く。
5. 確認後、本表の **最終確認** 列を \`YYYY-MM-DD\` に更新してよい（再生成時は同じ URL なら日付を引き継ぐ）。

---

## 一覧

| URL | ラベル | 参照元 | 種別 | 最終確認 |
| --- | --- | --- | --- | --- |
${table || "| （参考リンクなし） | | | | |"}

---

## 追加・削除時

| 操作 | やること |
| --- | --- |
| **リンクを新規追加** | 参照元ファイルに \`<a href="…" target="_blank" rel="noopener noreferrer">\` を書く。\`pnpm exam:external-links\` で本表を再生成する。 |
| **リンクを削除** | 参照元から HTML を削除。\`pnpm exam:external-links\` で本表を再生成する。 |
| **URL を変更** | 参照元を直し、\`pnpm exam:external-links\` で本表を再生成する。 |

問題 JSON・用語記事の手順書（\`exam-question-authoring.md\` / \`glossary-article-authoring.md\`）も参照。
`
}

function collectHits(official: Set<string>) {
  const hits: LinkHit[] = []

  for (const { name, data } of parseQuestionJsonFiles()) {
    const text = [
      data.stem,
      ...data.choices.map((choice) => `${choice.text}\n${choice.explanation ?? ""}`),
      data.sourceExplanation ?? "",
    ].join("\n")
    collectFromHtml(text, `src/content/questions/${name}`, hits)
  }

  if (fs.existsSync(articlesDir)) {
    for (const name of fs.readdirSync(articlesDir)) {
      if (!name.endsWith(".md") && !name.endsWith(".mdx")) continue
      if (name.startsWith("_")) continue
      const filePath = path.join(articlesDir, name)
      const text = fs.readFileSync(filePath, "utf8")
      const source = relativeSource(filePath)
      collectFromHtml(text, source, hits)
      collectFromMarkdown(text, source, hits)
    }
  }

  return hits.filter((hit) => !isOfficialUrl(hit.url, official))
}

function main() {
  const check = process.argv.includes("--check")
  const official = officialUrlSet()
  const hits = collectHits(official)
  const markdown = renderMarkdown(hits, previousCheckedDates())

  if (check) {
    const current = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : ""
    if (current !== markdown) {
      console.error(
        "docs/external-links.md がコンテンツと一致しません。pnpm exam:external-links を実行してください"
      )
      process.exitCode = 1
      return
    }
    console.log("[ok] docs/external-links.md は最新です")
    return
  }

  fs.writeFileSync(outPath, markdown)
  const unique = new Set(hits.map((hit) => hit.url)).size
  console.log(`${path.relative(repoRoot, outPath)}（${unique} URL）`)
}

main()
