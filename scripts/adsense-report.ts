/**
 * 公開サイトの AdSense 数字を標準出力に出す。
 * 開発中にチャットから収益・クリック・ページ別を見る用。Cloud / CI では使わない。
 *
 * 用法:
 *   pnpm adsense:report
 *   pnpm adsense:report --days 7
 *   pnpm adsense:report --days 28 --limit 40
 *   pnpm adsense:report --start 2026-10-01 --end 2026-10-25
 *   pnpm adsense:report --path /articles/
 *
 * 事前: pnpm adsense:auth。トークンは ~/.config/gcp/ に置く。チャットに貼らない。
 */
import { ADSENSE_PUBLISHER_ID } from "../src/lib/adsense.ts"
import { GA_PRODUCTION_HOST } from "../src/lib/analytics.ts"
import { adsenseAccessToken } from "./lib/adsense-local.ts"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TOKYO = "Asia/Tokyo"
const ACCOUNT = `accounts/${ADSENSE_PUBLISHER_ID}`
const SUMMARY_METRICS = [
  "ESTIMATED_EARNINGS",
  "PAGE_VIEWS",
  "IMPRESSIONS",
  "CLICKS",
  "PAGE_VIEWS_CTR",
  "PAGE_VIEWS_RPM",
  "COST_PER_CLICK",
] as const

type Args = {
  days: number
  start?: string
  end?: string
  limit: number
  path?: string
  help: boolean
}

type ReportHeader = { name?: string; type?: string; currencyCode?: string }
type ReportRow = { cells?: Array<{ value?: string }> }
type ReportResponse = {
  headers?: ReportHeader[]
  rows?: ReportRow[]
  totals?: ReportRow
  warnings?: string[]
  error?: { message?: string; status?: string }
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
    else throw new Error(`不明な引数: ${arg}`)
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
  if (args.start && args.end) return { startDate: args.start, endDate: args.end }
  const endDate = tokyoYmd(new Date())
  return { startDate: addTokyoDays(endDate, 1 - args.days), endDate }
}

function inclusiveDays(startDate: string, endDate: string): number {
  const start = Date.parse(`${startDate}T00:00:00+09:00`)
  const end = Date.parse(`${endDate}T00:00:00+09:00`)
  return Math.round((end - start) / 86_400_000) + 1
}

function ymdParts(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number)
  return { year: year!, month: month!, day: day! }
}

function column(headers: ReportHeader[], name: string) {
  return headers.findIndex((header) => header.name === name)
}

function cell(row: ReportRow | undefined, index: number) {
  if (index < 0) return ""
  return row?.cells?.[index]?.value ?? ""
}

function num(value: string): number {
  return Number(value || 0)
}

function formatCount(value: number) {
  return value.toLocaleString("ja-JP")
}

function formatMoney(value: number, currency = "JPY") {
  return value.toLocaleString("ja-JP", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatPercent(value: number) {
  return `${(value * 100).toLocaleString("ja-JP", { maximumFractionDigits: 2 })}%`
}

function currencyOf(headers: ReportHeader[]) {
  return headers.find((header) => header.currencyCode)?.currencyCode ?? "JPY"
}

async function generateReport(
  token: string,
  startDate: string,
  endDate: string,
  options: {
    metrics: readonly string[]
    dimensions?: string[]
    orderBy?: string
    limit?: number
  }
): Promise<ReportResponse> {
  const start = ymdParts(startDate)
  const end = ymdParts(endDate)
  const params = new URLSearchParams()
  for (const metric of options.metrics) params.append("metrics", metric)
  for (const dimension of options.dimensions ?? []) {
    params.append("dimensions", dimension)
  }
  params.set("dateRange", "CUSTOM")
  params.set("startDate.year", String(start.year))
  params.set("startDate.month", String(start.month))
  params.set("startDate.day", String(start.day))
  params.set("endDate.year", String(end.year))
  params.set("endDate.month", String(end.month))
  params.set("endDate.day", String(end.day))
  params.set("currencyCode", "JPY")
  params.set("languageCode", "ja")
  params.set("reportingTimeZone", "ACCOUNT_TIME_ZONE")
  if (options.orderBy) params.append("orderBy", options.orderBy)
  if (options.limit) params.set("limit", String(options.limit))

  const response = await fetch(
    `https://adsense.googleapis.com/v2/${ACCOUNT}/reports:generate?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const body = (await response.json()) as ReportResponse
  if (!response.ok) {
    throw new Error(body.error?.message ?? `AdSense API が ${response.status} を返しました`)
  }
  return body
}

function printHelp() {
  console.log(`公開サイト（${GA_PRODUCTION_HOST}）の AdSense 数字を出します。

用法:
  pnpm adsense:report
  pnpm adsense:report --days 7
  pnpm adsense:report --days 28 --limit 40
  pnpm adsense:report --start 2026-10-01 --end 2026-10-25
  pnpm adsense:report --path /articles/

事前に pnpm adsense:auth。トークンは ~/.config/gcp/ に置く。`)
}

function printBreakdown(
  title: string,
  report: ReportResponse,
  dimension: string,
  limit: number,
  path?: string
) {
  const headers = report.headers ?? []
  const dim = column(headers, dimension)
  const earnings = column(headers, "ESTIMATED_EARNINGS")
  const pageViews = column(headers, "PAGE_VIEWS")
  const impressions = column(headers, "IMPRESSIONS")
  const clicks = column(headers, "CLICKS")
  const currency = currencyOf(headers)
  let rows = report.rows ?? []
  if (path && dimension === "PAGE_URL") {
    rows = rows.filter((row) => cell(row, dim).includes(path))
  }
  if (rows.length === 0) {
    console.log(`${title}: この期間のデータがありません。`)
    return
  }
  console.log(title)
  for (const row of rows.slice(0, limit)) {
    const label = cell(row, dim) || "(not set)"
    const yen = formatMoney(num(cell(row, earnings)), currency).padStart(10)
    const pv = formatCount(num(cell(row, pageViews))).padStart(6)
    const imp = formatCount(num(cell(row, impressions))).padStart(6)
    const clk = formatCount(num(cell(row, clicks))).padStart(4)
    console.log(`${yen}  PV ${pv}  表示 ${imp}  クリック ${clk}  ${label}`)
  }
  console.log()
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  const { startDate, endDate } = dateRange(args)
  const days = inclusiveDays(startDate, endDate)
  const token = await adsenseAccessToken()
  const breakdownMetrics = [
    "ESTIMATED_EARNINGS",
    "PAGE_VIEWS",
    "IMPRESSIONS",
    "CLICKS",
  ] as const

  const [summary, daily, pages, units] = await Promise.all([
    generateReport(token, startDate, endDate, { metrics: SUMMARY_METRICS }),
    generateReport(token, startDate, endDate, {
      metrics: breakdownMetrics,
      dimensions: ["DATE"],
      orderBy: "+DATE",
      limit: 366,
    }),
    generateReport(token, startDate, endDate, {
      metrics: breakdownMetrics,
      dimensions: ["PAGE_URL"],
      orderBy: "-ESTIMATED_EARNINGS",
      limit: 100,
    }).catch((error) => {
      console.error(
        `ページ別は取れませんでした: ${error instanceof Error ? error.message : error}`
      )
      return { rows: [] } satisfies ReportResponse
    }),
    generateReport(token, startDate, endDate, {
      metrics: breakdownMetrics,
      dimensions: ["AD_UNIT_NAME"],
      orderBy: "-ESTIMATED_EARNINGS",
      limit: args.limit,
    }).catch((error) => {
      console.error(
        `ユニット別は取れませんでした: ${error instanceof Error ? error.message : error}`
      )
      return { rows: [] } satisfies ReportResponse
    }),
  ])

  const headers = summary.headers ?? []
  const totals = summary.totals ?? summary.rows?.[0]
  const currency = currencyOf(headers)
  const earnings = num(cell(totals, column(headers, "ESTIMATED_EARNINGS")))
  const pageViews = num(cell(totals, column(headers, "PAGE_VIEWS")))
  const impressions = num(cell(totals, column(headers, "IMPRESSIONS")))
  const clicks = num(cell(totals, column(headers, "CLICKS")))
  const ctr = num(cell(totals, column(headers, "PAGE_VIEWS_CTR")))
  const rpm = num(cell(totals, column(headers, "PAGE_VIEWS_RPM")))
  const cpc = num(cell(totals, column(headers, "COST_PER_CLICK")))

  console.log(`# AdSense ${GA_PRODUCTION_HOST}  ${ACCOUNT}`)
  console.log(`期間: ${startDate} 〜 ${endDate}（${days}日）`)
  if (args.path) {
    console.log(`絞り込み: ページ一覧のみ URL に "${args.path}"（合計はサイト全体）`)
  }
  console.log(`推定収益  ${formatMoney(earnings, currency)}`)
  console.log(`ページビュー  ${formatCount(pageViews)}`)
  console.log(`インプレッション  ${formatCount(impressions)}`)
  console.log(`クリック  ${formatCount(clicks)}`)
  console.log(`CTR  ${formatPercent(ctr)}`)
  console.log(`RPM  ${formatMoney(rpm, currency)}`)
  console.log(`CPC  ${formatMoney(cpc, currency)}`)
  console.log()

  const dailyHeaders = daily.headers ?? []
  const dailyRows = daily.rows ?? []
  if (dailyRows.length > 0) {
    const dateCol = column(dailyHeaders, "DATE")
    const earnCol = column(dailyHeaders, "ESTIMATED_EARNINGS")
    const pvCol = column(dailyHeaders, "PAGE_VIEWS")
    const clickCol = column(dailyHeaders, "CLICKS")
    const dailyCurrency = currencyOf(dailyHeaders)
    console.log("日付")
    for (const row of dailyRows) {
      const ymd = cell(row, dateCol)
      const yen = formatMoney(num(cell(row, earnCol)), dailyCurrency).padStart(10)
      const pv = formatCount(num(cell(row, pvCol))).padStart(6)
      const clk = formatCount(num(cell(row, clickCol))).padStart(4)
      console.log(`${ymd}  ${yen}  PV ${pv}  クリック ${clk}`)
    }
    console.log()
  }

  printBreakdown("ページ（収益順）", pages, "PAGE_URL", args.limit, args.path)
  printBreakdown("広告ユニット", units, "AD_UNIT_NAME", args.limit)

  if (impressions === 0 && earnings === 0) {
    console.log(
      "この期間は配信数字がありません。サイト審査中か、まだ広告が読まれていない可能性があります。"
    )
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
