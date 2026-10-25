/**
 * 公開サイト（ralacode.com）の GA4 数字を標準出力に出す。
 * 開発中にチャットから PV を見る用。Cloud / CI では使わない。
 *
 * 用法:
 *   pnpm analytics:report
 *   pnpm analytics:report --days 7
 *   pnpm analytics:report --days 28 --limit 40
 *   pnpm analytics:report --start 2026-10-01 --end 2026-10-25
 *   pnpm analytics:report --path /articles/
 *
 * 認証: ~/.config/gcp/ のサービスアカウント JSON、または GOOGLE_APPLICATION_CREDENTIALS。
 * 鍵はリポジトリに置かない。チャットに JSON を貼らない。
 */
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { GoogleAuth } from "google-auth-library"
import { GA4_PROPERTY_ID, GA_PRODUCTION_HOST } from "../src/lib/analytics.ts"

const ANALYTICS_READONLY = "https://www.googleapis.com/auth/analytics.readonly"
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TOKYO = "Asia/Tokyo"

type Args = {
  days: number
  start?: string
  end?: string
  limit: number
  path?: string
  property?: string
  help: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = { days: 28, limit: 20, help: false }
  let daysSet = false
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!
    if (arg === "--help" || arg === "-h") args.help = true
    else if (arg === "--days") {
      args.days = Number(argv[++i])
      daysSet = true
    } else if (arg.startsWith("--days=")) {
      args.days = Number(arg.slice("--days=".length))
      daysSet = true
    } else if (arg === "--start") args.start = argv[++i]
    else if (arg.startsWith("--start=")) args.start = arg.slice("--start=".length)
    else if (arg === "--end") args.end = argv[++i]
    else if (arg.startsWith("--end=")) args.end = arg.slice("--end=".length)
    else if (arg === "--limit") args.limit = Number(argv[++i])
    else if (arg.startsWith("--limit=")) args.limit = Number(arg.slice("--limit=".length))
    else if (arg === "--path") args.path = argv[++i]
    else if (arg.startsWith("--path=")) args.path = arg.slice("--path=".length)
    else if (arg === "--property") args.property = argv[++i]
    else if (arg.startsWith("--property=")) {
      args.property = arg.slice("--property=".length)
    } else {
      throw new Error(`不明な引数: ${arg}`)
    }
  }
  if (args.help) return args
  if ((args.start || args.end) && daysSet) {
    throw new Error("--days と --start / --end は同時に指定できません")
  }
  if (Boolean(args.start) !== Boolean(args.end)) {
    throw new Error("--start と --end は両方指定してください")
  }
  if (args.start && !DATE_RE.test(args.start)) {
    throw new Error("--start は YYYY-MM-DD で指定してください")
  }
  if (args.end && !DATE_RE.test(args.end)) {
    throw new Error("--end は YYYY-MM-DD で指定してください")
  }
  if (args.start && args.end && args.start > args.end) {
    throw new Error("--start は --end 以前の日付にしてください")
  }
  if (!args.start && (!Number.isInteger(args.days) || args.days < 1)) {
    throw new Error("--days には 1 以上の整数を指定してください")
  }
  if (!Number.isInteger(args.limit) || args.limit < 1) {
    throw new Error("--limit には 1 以上の整数を指定してください")
  }
  return args
}

function tokyoYmd(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TOKYO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function addTokyoDays(ymd: string, days: number): string {
  const date = new Date(`${ymd}T00:00:00+09:00`)
  date.setUTCDate(date.getUTCDate() + days)
  return tokyoYmd(date)
}

function dateRange(args: Args): { startDate: string; endDate: string } {
  if (args.start && args.end) {
    return { startDate: args.start, endDate: args.end }
  }
  const endDate = tokyoYmd(new Date())
  return { startDate: addTokyoDays(endDate, 1 - args.days), endDate }
}

function inclusiveDays(startDate: string, endDate: string): number {
  const start = Date.parse(`${startDate}T00:00:00+09:00`)
  const end = Date.parse(`${endDate}T00:00:00+09:00`)
  return Math.round((end - start) / 86_400_000) + 1
}

function resolveCredentialsPath(): string {
  const fromEnv =
    process.env.GA4_CREDENTIALS ?? process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (fromEnv) {
    if (!fs.existsSync(fromEnv)) {
      throw new Error(`認証ファイルがありません: ${fromEnv}`)
    }
    return fromEnv
  }

  const gcpDir = path.join(os.homedir(), ".config", "gcp")
  const preferred = path.join(gcpDir, "ralacode-ga4.json")
  if (fs.existsSync(preferred)) return preferred

  if (!fs.existsSync(gcpDir)) {
    throw new Error(credentialsHelp())
  }
  const matches = fs
    .readdirSync(gcpDir)
    .filter((name) => name.startsWith("ralacode") && name.endsWith(".json"))
    .sort()
    .map((name) => path.join(gcpDir, name))
  if (matches.length === 1) return matches[0]!
  if (matches.length > 1) {
    const analytics = matches.find((filePath) => filePath.includes("analytics"))
    if (analytics) return analytics
    throw new Error(
      `${gcpDir} に ralacode*.json が複数あります。GA4_CREDENTIALS で指定してください`
    )
  }
  throw new Error(credentialsHelp())
}

function credentialsHelp(): string {
  return [
    "サービスアカウントの JSON が見つかりません。",
    "次のいずれかに置いてください。",
    "  %USERPROFILE%\\.config\\gcp\\ralacode-ga4.json",
    "  環境変数 GA4_CREDENTIALS または GOOGLE_APPLICATION_CREDENTIALS",
    "鍵はリポジトリに置かないでください。",
  ].join("\n")
}

async function accessToken(keyFile: string): Promise<string> {
  const auth = new GoogleAuth({
    keyFile,
    scopes: [ANALYTICS_READONLY],
  })
  const client = await auth.getClient()
  const token = await client.getAccessToken()
  if (!token.token) throw new Error("サービスアカウントのアクセストークンを取得できませんでした")
  return token.token
}

type AccountSummary = {
  propertySummaries?: Array<{
    property?: string
    displayName?: string
  }>
}

async function discoverPropertyId(keyFile: string): Promise<string> {
  const token = await accessToken(keyFile)
  const response = await fetch(
    "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const body = (await response.json()) as {
    error?: { message?: string; status?: string }
    accountSummaries?: AccountSummary[]
  }
  if (!response.ok) {
    const message = body.error?.message ?? response.statusText
    if (body.error?.status === "PERMISSION_DENIED") {
      throw new Error(
        [
          "プロパティ ID を自動取得できませんでした。",
          message,
          "次のいずれかで数字のプロパティ ID を渡してください。",
          "  pnpm analytics:report --property 123456789",
          "  環境変数 GA4_PROPERTY_ID",
          "  %USERPROFILE%\\.config\\gcp\\ralacode-ga4.property に数字だけ書く",
          "または Google Analytics Admin API を有効にすると、次回から自動で探します。",
          "https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com?project=ralacode-medical-analytics",
        ].join("\n")
      )
    }
    throw new Error(`プロパティ ID の取得に失敗しました: ${message}`)
  }

  const properties =
    body.accountSummaries?.flatMap((account) => account.propertySummaries ?? []) ??
    []
  if (properties.length === 0) {
    throw new Error(
      "このサービスアカウントから見える GA4 プロパティがありません。プロパティのアクセス管理で閲覧者になっているか確認してください"
    )
  }
  const named = properties.find((property) => {
    const name = `${property.displayName ?? ""} ${property.property ?? ""}`
    return name.toLowerCase().includes("ralacode")
  })
  const chosen = named ?? (properties.length === 1 ? properties[0] : undefined)
  const id = chosen?.property?.replace(/^properties\//, "")
  if (!id) {
    const list = properties
      .map((property) => `- ${property.property} ${property.displayName ?? ""}`)
      .join("\n")
    throw new Error(
      `プロパティが複数あります。--property で選んでください。\n${list}`
    )
  }
  return id
}

type ReportRow = {
  dimensionValues?: Array<{ value?: string | null }>
  metricValues?: Array<{ value?: string | null }>
}

type ReportResponse = {
  rows?: ReportRow[]
  error?: { message?: string; status?: string }
}

type ReportRequest = {
  dateRanges: Array<{ startDate: string; endDate: string }>
  dimensions?: Array<{ name: string }>
  metrics: Array<{ name: string }>
  orderBys?: Array<{
    desc?: boolean
    dimension?: { dimensionName: string }
    metric?: { metricName: string }
  }>
  limit?: number
  dimensionFilter?: {
    filter: {
      fieldName: string
      stringFilter: { matchType: "CONTAINS"; value: string }
    }
  }
}

async function runReport(
  token: string,
  propertyId: string,
  request: ReportRequest
): Promise<ReportResponse> {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  )
  const body = (await response.json()) as ReportResponse
  if (!response.ok) {
    throw new Error(body.error?.message ?? `Data API が ${response.status} を返しました`)
  }
  return body
}

function readLocalPropertyId(): string | undefined {
  const filePath = path.join(os.homedir(), ".config", "gcp", "ralacode-ga4.property")
  if (!fs.existsSync(filePath)) return undefined
  return fs.readFileSync(filePath, "utf8").trim()
}

function normalizePropertyId(raw: string, source: string): string {
  const trimmed = raw.trim().replace(/^properties\//, "")
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(
      `${source} のプロパティ ID は数字です。測定 ID（G-...）ではありません`
    )
  }
  return trimmed
}

async function resolvePropertyId(args: Args, keyFile: string): Promise<string> {
  if (args.property) return normalizePropertyId(args.property, "--property")
  if (process.env.GA4_PROPERTY_ID) {
    return normalizePropertyId(process.env.GA4_PROPERTY_ID, "GA4_PROPERTY_ID")
  }
  if (GA4_PROPERTY_ID) return normalizePropertyId(GA4_PROPERTY_ID, "GA4_PROPERTY_ID")
  const fromFile = readLocalPropertyId()
  if (fromFile) return normalizePropertyId(fromFile, "~/.config/gcp/ralacode-ga4.property")
  return discoverPropertyId(keyFile)
}

function num(value: string | null | undefined): number {
  return Number(value ?? 0)
}

function formatCount(value: number): string {
  return value.toLocaleString("ja-JP")
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0秒"
  const rounded = Math.round(seconds)
  const hours = Math.floor(rounded / 3600)
  const minutes = Math.floor((rounded % 3600) / 60)
  const rest = rounded % 60
  if (hours > 0) return `${hours}時間${minutes}分`
  if (minutes > 0) return `${minutes}分${rest}秒`
  return `${rest}秒`
}

function cell(
  row: { dimensionValues?: Array<{ value?: string | null }> | null; metricValues?: Array<{ value?: string | null }> | null },
  kind: "dimension" | "metric",
  index: number
): string {
  const values = kind === "dimension" ? row.dimensionValues : row.metricValues
  return values?.[index]?.value ?? ""
}

function printHelp(): void {
  console.log(`公開サイト（${GA_PRODUCTION_HOST}）の GA4 数字を出します。

用法:
  pnpm analytics:report
  pnpm analytics:report --days 7
  pnpm analytics:report --days 28 --limit 40
  pnpm analytics:report --start 2026-10-01 --end 2026-10-25
  pnpm analytics:report --path /articles/
  pnpm analytics:report --property 123456789

認証は ~/.config/gcp/ のサービスアカウント JSON、または GOOGLE_APPLICATION_CREDENTIALS。
鍵はリポジトリに置かないでください。`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  const keyFile = resolveCredentialsPath()
  const token = await accessToken(keyFile)
  const propertyId = await resolvePropertyId(args, keyFile)
  const { startDate, endDate } = dateRange(args)
  const days = inclusiveDays(startDate, endDate)
  const pathFilter = args.path
    ? {
        filter: {
          fieldName: "pagePath",
          stringFilter: {
            matchType: "CONTAINS" as const,
            value: args.path,
          },
        },
      }
    : undefined
  const range = { dateRanges: [{ startDate, endDate }], dimensionFilter: pathFilter }

  const [summary, daily, pages] = await Promise.all([
    runReport(token, propertyId, {
      ...range,
      metrics: [
        { name: "screenPageViews" },
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "averageSessionDuration" },
      ],
    }),
    runReport(token, propertyId, {
      ...range,
      dimensions: [{ name: "date" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: 366,
    }),
    runReport(token, propertyId, {
      ...range,
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
      orderBys: [{ desc: true, metric: { metricName: "screenPageViews" } }],
      limit: args.limit,
    }),
  ])

  const totals = summary.rows?.[0]
  const pageViews = num(cell(totals ?? {}, "metric", 0))
  const users = num(cell(totals ?? {}, "metric", 1))
  const sessions = num(cell(totals ?? {}, "metric", 2))
  const duration = num(cell(totals ?? {}, "metric", 3))

  console.log(`# GA4 ${GA_PRODUCTION_HOST}  properties/${propertyId}`)
  console.log(`期間: ${startDate} 〜 ${endDate}（${days}日・Asia/Tokyo）`)
  if (args.path) console.log(`絞り込み: pagePath に "${args.path}"`)
  console.log(`PV  ${formatCount(pageViews)}`)
  console.log(`ユーザー  ${formatCount(users)}`)
  console.log(`セッション  ${formatCount(sessions)}`)
  console.log(`平均セッション  ${formatDuration(duration)}`)
  console.log()

  const dailyRows = daily.rows ?? []
  if (dailyRows.length > 0) {
    console.log("日付")
    for (const row of dailyRows) {
      const raw = cell(row, "dimension", 0)
      const ymd = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
      const pv = formatCount(num(cell(row, "metric", 0))).padStart(8)
      const au = formatCount(num(cell(row, "metric", 1))).padStart(6)
      console.log(`${ymd}  ${pv}  PV  ${au}  ユーザー`)
    }
    console.log()
  }

  const pageRows = pages.rows ?? []
  if (pageRows.length === 0) {
    console.log(
      "この期間にページ閲覧がありません。反映はリアルタイムが数十秒、通常レポートは当日〜翌日です。"
    )
    return
  }
  console.log(`ページ（PV 順・最大 ${args.limit}）`)
  for (const row of pageRows) {
    const pagePath = cell(row, "dimension", 0) || "(not set)"
    const pv = formatCount(num(cell(row, "metric", 0))).padStart(8)
    const au = formatCount(num(cell(row, "metric", 1))).padStart(6)
    console.log(`${pv}  PV  ${au}  ユーザー  ${pagePath}`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
