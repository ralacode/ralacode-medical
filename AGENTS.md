# AGENTS.md

診療放射線技師国家試験の類似問題演習サイト（Astro 7 + React 19 + Tailwind 4）。エージェント向けの作業手順書。

## セットアップとコマンド

- Node 22 以上（`.node-version`）、パッケージマネージャは **pnpm**（`package.json` の `packageManager`）。
- 依存: `pnpm install --frozen-lockfile`

| コマンド | 用途 |
| --- | --- |
| `pnpm dev` / `pnpm build` | 開発サーバー / 本番ビルド。問題 JSON のスキーマ不備は `build` で失敗する |
| `pnpm lint` / `pnpm typecheck` | ESLint / `astro check` |
| `pnpm lint:questions` | 問題 JSON のゲート検査（ファイル名 / `mapsTo` / 科目がマニフェストと一致。2026 年は形式を祖父化） |
| `pnpm verify:exam-pages` | 公式 PDF ページ表と `sourceExplanation` のリンク照合。Cloud / CI では `--strict`（PDF 未取得を失敗にする） |
| `pnpm exam:manifest --year 2026` | 既存 JSON からスロット台帳 `src/data/exam-manifests/{year}.json` を逆生成 |
| `pnpm exam:external-links` | 参考リンク台帳 `docs/external-links.md` をコンテンツから再生成 |
| `pnpm exam:fetch-pdfs` | 厚労省の公式 PDF を `exams/{year}/` にダウンロード（既存はスキップ） |
| `pnpm exam:pdf-text <year> <kind> [--pages 5-7 \| --question 13 \| --toc]` | 公式 PDF のテキストを閲覧。`kind` は `am` / `pm` / `am-supplement` / `pm-supplement` / `answers` |
| `pnpm exam:pdf-render <year> <kind> --pages N` | ページを PNG に描画（別冊の画像確認用）。出力は `exams/_render/` |
| `pnpm analytics:report [--days 28] [--path /articles/]` | 公開サイトの GA4 PV を出す。鍵は `~/.config/gcp/`（リポジトリに置かない）。Cloud / CI では使わない |

## リポジトリの決まり

- 類似問題の作成を頼まれたら、作業の最初に `docs/exam-question-authoring.md` を読み、その手順と禁止事項に従う。
- Cloud に貼る指示文だけを頼まれたら、JSON は作らず、最初に `docs/cloud-subject-prompt.md` を読む。
- 用語解説記事の作成・編集を頼まれたら、作業の最初に `docs/glossary-article-authoring.md` を読む。
- YouTube ショート（動画、台本、テロップ、登場人物、音声、タイトル・説明・サムネイル・タグ）を頼まれたら、作業の最初に `docs/youtube-short-production.md` を読む。テーマ・尺・公開順は `docs/content-strategy-youtube-seo.md` の §5。
- Cursor の Cloud Agent（Cursor Cloud / Background Agent）向けの追加手順は `.cursor/rules/cursor-cloud.mdc` にある。適用されるのは、そのエージェントとして起動されたセッションだけ。Claude Code と、Cursor のローカル対話には適用しない。
- 試験科目の分類: `docs/exam-subjects-amendment-2023.md`、科目 ID は `src/lib/exam-subjects.ts`（理工学の学習タグに放射化学 `hoshasen-kagaku` を含む。第75回・第76回は改正前科目をこの ID に寄せる）
- **公式の問題文・選択肢・別冊画像をリポジトリ・PR 本文・チャットに転載しない。** `exams/` と `exams/_render/` は gitignore。`public/` に置かない。
- **類似問題は公開年をすべて無料で出す**（`src/lib/exam-visibility.ts` の `publishedExamYears`）。直近 N 年だけ、という制限はない。年を公開リストに足すのは、**200 問揃い、ユーザーが公開を指示したときだけ**。自動では足さない。未掲載の年（2023 年など）は準備中。開発サーバでは、未公開年でもその年の問があれば中身を出して作成確認できる。問の `draft` は未完成フラグであり、年次の公開可否ではない。
- **レイアウト・CSS・既存コンポーネントは、明示的に依頼されたときだけ触る。**
- CI は `.github/workflows/ci.yml`。類似問題の PR 本文は `.github/PULL_REQUEST_TEMPLATE/exam.md`、記事・基盤は `.github/pull_request_template.md`。
