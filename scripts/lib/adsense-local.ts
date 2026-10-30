/**
 * AdSense Management API 用のローカル認証ファイル。
 * 鍵もトークンもリポジトリに置かない。Cloud / CI では使わない。
 */
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { UserRefreshClient } from "google-auth-library"

export const ADSENSE_READONLY = "https://www.googleapis.com/auth/adsense.readonly"

export function gcpDir() {
  return path.join(os.homedir(), ".config", "gcp")
}

export function adsenseOAuthClientPath() {
  return process.env.ADSENSE_OAUTH_CLIENT ?? path.join(gcpDir(), "ralacode-adsense-oauth.json")
}

export function adsenseTokenPath() {
  return process.env.ADSENSE_TOKEN ?? path.join(gcpDir(), "ralacode-adsense-token.json")
}

type InstalledClient = {
  clientId: string
  clientSecret: string
}

export function loadInstalledClient(): InstalledClient {
  const filePath = adsenseOAuthClientPath()
  if (!fs.existsSync(filePath)) {
    throw new Error(
      [
        "OAuth クライアント JSON がありません。",
        "Google Cloud の「デスクトップ アプリ」クライアントをダウンロードし、次に置いてください。",
        `  ${filePath}`,
        "チャットに JSON を貼らないでください。",
      ].join("\n")
    )
  }
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
    installed?: { client_id?: string; client_secret?: string }
    web?: unknown
    client_id?: string
    client_secret?: string
  }
  if (raw.web && !raw.installed) {
    throw new Error(
      "この JSON はウェブアプリ用です。認証情報は「デスクトップ アプリ」で作り直してください"
    )
  }
  const clientId = raw.installed?.client_id ?? raw.client_id
  const clientSecret = raw.installed?.client_secret ?? raw.client_secret
  if (!clientId || !clientSecret) {
    throw new Error(`OAuth クライアント JSON の形が違います: ${filePath}`)
  }
  return { clientId, clientSecret }
}

export function saveAdsenseToken(client: InstalledClient, refreshToken: string) {
  fs.mkdirSync(gcpDir(), { recursive: true })
  const filePath = adsenseTokenPath()
  fs.writeFileSync(
    filePath,
    `${JSON.stringify(
      {
        type: "authorized_user",
        client_id: client.clientId,
        client_secret: client.clientSecret,
        refresh_token: refreshToken,
      },
      null,
      2
    )}\n`,
    { encoding: "utf8", mode: 0o600 }
  )
  return filePath
}

export function loadAdsenseTokenClient(): UserRefreshClient {
  const filePath = adsenseTokenPath()
  if (!fs.existsSync(filePath)) {
    throw new Error(
      [
        "AdSense のログイントークンがありません。一度だけ次を実行してください。",
        "  pnpm adsense:auth",
        `保存先: ${filePath}`,
      ].join("\n")
    )
  }
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
    client_id?: string
    client_secret?: string
    refresh_token?: string
  }
  if (!raw.client_id || !raw.client_secret || !raw.refresh_token) {
    throw new Error(`トークン JSON の形が違います。pnpm adsense:auth をやり直してください`)
  }
  return new UserRefreshClient({
    clientId: raw.client_id,
    clientSecret: raw.client_secret,
    refreshToken: raw.refresh_token,
  })
}

export async function adsenseAccessToken(): Promise<string> {
  const client = loadAdsenseTokenClient()
  try {
    const token = await client.getAccessToken()
    if (!token.token) throw new Error("アクセストークンを取得できませんでした")
    return token.token
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/invalid_grant/i.test(message)) {
      throw new Error(
        [
          "AdSense のログインの有効期限が切れています。",
          "pnpm adsense:auth をもう一度実行してください。",
          "OAuth 同意画面が「テスト」のままだと、トークンは 7 日で切れます。「本番」にすると長持ちします。",
        ].join("\n")
      )
    }
    throw error
  }
}
