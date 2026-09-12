/**
 * 公式 PDF のページを PNG に描画する（別冊の画像・図表を目で確認する用）。
 * 出力先は既定で exams/_render/（/exams/ は gitignore）。画像をリポジトリや public/ に置かないこと。
 *
 * 用法:
 *   pnpm exam:pdf-render 2026 am-supplement --pages 5        → exams/_render/2026-78th-am-supplement-p005.png
 *   pnpm exam:pdf-render 2026 pm --pages 11-12 --scale 3
 *   pnpm exam:pdf-render exams/2026/2026-78th-answers.pdf --pages 1 --out /tmp/render
 */
import fs from "node:fs"
import path from "node:path"
import {
  loadExamPdf,
  parsePageSpec,
  repoRoot,
  resolveExamPdf,
} from "./lib/exam-pdf.ts"

type Args = {
  positional: string[]
  pages?: string
  scale: number
  out: string
}

function parseArgs(argv: string[]): Args {
  const args: Args = { positional: [], scale: 2, out: "exams/_render" }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!
    if (arg === "--pages") args.pages = argv[++i]
    else if (arg.startsWith("--pages=")) args.pages = arg.slice("--pages=".length)
    else if (arg === "--scale") args.scale = Number(argv[++i])
    else if (arg.startsWith("--scale=")) args.scale = Number(arg.slice("--scale=".length))
    else if (arg === "--out") args.out = argv[++i]!
    else if (arg.startsWith("--out=")) args.out = arg.slice("--out=".length)
    else if (arg.startsWith("--")) throw new Error(`不明なオプション: ${arg}`)
    else args.positional.push(arg)
  }
  if (!args.pages) throw new Error("--pages でページ（例: 5 や 5-7）を指定してください")
  if (!Number.isFinite(args.scale) || args.scale <= 0) {
    throw new Error("--scale は正の数です")
  }
  return args
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const { absolutePath, label } = resolveExamPdf(args.positional)
  const document = await loadExamPdf(absolutePath)
  const pages = parsePageSpec(args.pages!, document.numPages)

  // pdfjs は Node では @napi-rs/canvas を使う（devDependency）
  const { createCanvas } = await import("@napi-rs/canvas")

  const outDir = path.resolve(repoRoot, args.out)
  fs.mkdirSync(outDir, { recursive: true })

  for (const pageNumber of pages) {
    const page = await document.getPage(pageNumber)
    const viewport = page.getViewport({ scale: args.scale })
    const canvas = createCanvas(
      Math.ceil(viewport.width),
      Math.ceil(viewport.height)
    )
    const context = canvas.getContext("2d")
    await page.render({
      canvas: canvas as unknown as HTMLCanvasElement,
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise

    const fileName = `${label}-p${String(pageNumber).padStart(3, "0")}.png`
    const outPath = path.join(outDir, fileName)
    fs.writeFileSync(outPath, canvas.toBuffer("image/png"))
    console.log(outPath)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
