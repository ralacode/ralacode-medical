/**
 * AdSense Management API 用の OAuth を一度だけ通す。
 * ブラウザで AdSense と同じ Google アカウントにログインする。
 *
 * 用法:
 *   pnpm adsense:auth
 *   pnpm adsense:auth --email adsense-owner@example.com
 *
 * 事前: ~/.config/gcp/ralacode-adsense-oauth.json にデスクトップ アプリのクライアント JSON。
 * トークンは ~/.config/gcp/ralacode-adsense-token.json に保存する。リポジトリに置かない。
 */
import http from "node:http"
import { execFile } from "node:child_process"
import { OAuth2Client } from "google-auth-library"
import {
  ADSENSE_READONLY,
  adsenseOAuthClientPath,
  loadInstalledClient,
  saveAdsenseToken,
} from "./lib/adsense-local.ts"

function parseArgs(argv: string[]) {
  let email: string | undefined
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!
    if (arg === "--email") email = argv[++i]
    else if (arg.startsWith("--email=")) email = arg.slice("--email=".length)
    else throw new Error(`不明な引数: ${arg}`)
  }
  return { email }
}

function openBrowser(url: string) {
  if (process.platform === "win32") {
    execFile("cmd", ["/c", "start", "", url], { windowsHide: true })
    return
  }
  execFile(process.platform === "darwin" ? "open" : "xdg-open", [url])
}

function startCodeServer(): Promise<{ port: number; code: Promise<string> }> {
  return new Promise((resolveListen, rejectListen) => {
    let resolveCode: (value: string) => void = () => {}
    let rejectCode: (error: Error) => void = () => {}
    const code = new Promise<string>((resolve, reject) => {
      resolveCode = resolve
      rejectCode = reject
    })

    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? "/", "http://127.0.0.1")
      const err = url.searchParams.get("error")
      const authCode = url.searchParams.get("code")
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
      if (err) {
        res.end("認可がキャンセルされました。このタブを閉じてください。")
        server.close()
        rejectCode(new Error(err))
        return
      }
      if (!authCode) {
        res.end("認可コードがありません。")
        return
      }
      res.end("認可できました。このタブを閉じて、ターミナルに戻ってください。")
      server.close(() => resolveCode(authCode))
    })

    server.once("error", rejectListen)
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      if (!address || typeof address === "string") {
        rejectListen(new Error("ローカル待受ポートを取れませんでした"))
        return
      }
      server.on("error", rejectCode)
      resolveListen({ port: address.port, code })
    })
  })
}

async function main() {
  const { email } = parseArgs(process.argv.slice(2))
  const client = loadInstalledClient()
  const { port, code } = await startCodeServer()
  const oauth = new OAuth2Client({
    clientId: client.clientId,
    clientSecret: client.clientSecret,
    redirectUri: `http://127.0.0.1:${port}`,
  })
  const authUrl = oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "select_account consent",
    scope: [ADSENSE_READONLY],
    ...(email ? { login_hint: email } : {}),
  })
  const chooserUrl = `https://accounts.google.com/AccountChooser?continue=${encodeURIComponent(authUrl)}`

  console.log("アカウント選択画面が開きます。AdSense を使っている Google アカウントを選んでください。")
  if (email) console.log(`指定: ${email}`)
  console.log("ブラウザがデフォルトアカウントのまま進んだら、この URL をコピーして別のブラウザ（または別プロファイル）で開いてください。")
  console.log(chooserUrl)
  openBrowser(chooserUrl)

  const { tokens } = await oauth.getToken(await code)
  if (!tokens.refresh_token) {
    throw new Error(
      "refresh_token が返りませんでした。同意画面で権限を許可し、pnpm adsense:auth をやり直してください"
    )
  }
  const saved = saveAdsenseToken(client, tokens.refresh_token)
  console.log(`保存しました: ${saved}`)
  console.log("次は pnpm adsense:report です。")
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  console.error(`OAuth クライアント: ${adsenseOAuthClientPath()}`)
  process.exitCode = 1
})
