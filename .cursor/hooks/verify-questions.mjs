/**
 * 問題 JSON・マニフェスト・記事を触ったターンの終わりに、
 * lint:questions / verify:exam-pages / exam:external-links --check を回す。
 */
import { spawnSync } from "node:child_process"
import fs from "node:fs"

function gitLines(args) {
  const result = spawnSync("git", args, { encoding: "utf8" })
  if (result.status !== 0) return []
  return (result.stdout ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function changedPaths() {
  return new Set([
    ...gitLines(["diff", "--name-only", "HEAD"]),
    ...gitLines(["diff", "--cached", "--name-only"]),
    ...gitLines(["ls-files", "--others", "--exclude-standard"]),
  ])
}

function isRelevant(filePath) {
  return (
    filePath.startsWith("src/content/questions/") ||
    filePath.startsWith("src/data/exam-manifests/") ||
    filePath.startsWith("src/content/articles/") ||
    filePath === "src/lib/exam-data.ts" ||
    filePath === "src/lib/exam-manifest.ts" ||
    filePath === "docs/external-links.md" ||
    filePath.startsWith("scripts/lint-questions") ||
    filePath.startsWith("scripts/verify-exam-pages") ||
    filePath.startsWith("scripts/extract-external-links")
  )
}

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    env: process.env,
    shell: process.platform === "win32",
    timeout: 170_000,
  })
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim()
  return { ok: result.status === 0, output }
}

try {
  fs.readFileSync(0, "utf8")
} catch {
  // stdin が空でも続ける
}

const relevant = [...changedPaths()].some(isRelevant)
if (!relevant) {
  process.stdout.write("{}\n")
  process.exit(0)
}

const checks = [
  ["pnpm", ["lint:questions"]],
  ["pnpm", ["verify:exam-pages"]],
  ["pnpm", ["exam:external-links", "--check"]],
]

const failed = []
for (const [command, args] of checks) {
  const result = run(command, args)
  if (!result.ok) {
    failed.push(`$ ${command} ${args.join(" ")}\n${result.output}`)
  }
}

if (failed.length === 0) {
  process.stdout.write("{}\n")
  process.exit(0)
}

const followup = [
  "問題作成の検査が失敗しました。出力を直してから作業を終えてください。",
  "",
  ...failed,
].join("\n")

process.stdout.write(`${JSON.stringify({ followup_message: followup })}\n`)
