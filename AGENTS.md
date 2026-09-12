# AGENTS.md

診療放射線技師国家試験の類似問題演習サイト（Astro 7 + React 19 + Tailwind 4）。エージェント向けの作業手順書。

## セットアップとコマンド

- Node 22 以上（`.node-version`）、パッケージマネージャは **pnpm**（`package.json` の `packageManager`）。
- 依存: `pnpm install --frozen-lockfile`

| コマンド | 用途 |
| --- | --- |
| `pnpm dev` / `pnpm build` | 開発サーバー / 本番ビルド。問題 JSON のスキーマ不備は `build` で失敗する |
| `pnpm lint` / `pnpm typecheck` | ESLint / `astro check` |
| `pnpm verify:exam-pages` | 公式 PDF ページ表と `sourceExplanation` のリンク照合 |
| `pnpm exam:fetch-pdfs` | 厚労省の公式 PDF を `exams/{year}/` にダウンロード（既存はスキップ） |
| `pnpm exam:pdf-text <year> <kind> [--pages 5-7 \| --question 13 \| --toc]` | 公式 PDF のテキストを閲覧。`kind` は `am` / `pm` / `am-supplement` / `pm-supplement` / `answers` |
| `pnpm exam:pdf-render <year> <kind> --pages N` | ページを PNG に描画（別冊の画像確認用）。出力は `exams/_render/` |

## リポジトリの決まり

- 類似問題の作成: `.cursor/rules/exam-question-authoring.mdc` → `docs/exam-question-authoring.md`
- 用語解説記事: `.cursor/rules/glossary-article-authoring.mdc` → `docs/glossary-article-authoring.md`
- 試験科目の分類: `docs/exam-subjects-amendment-2023.md`、科目 ID は `src/lib/exam-subjects.ts`
- **公式の問題文・選択肢・別冊画像をリポジトリ・PR 本文・チャットに転載しない。** `exams/` と `exams/_render/` は gitignore。`public/` に置かない。
- **レイアウト・CSS・既存コンポーネントは、明示的に依頼されたときだけ触る。**

## Cursor Cloud specific instructions

Cloud Agent（Cursor Cloud / Background Agent）として起動されたときの追加ルール。ローカルの対話セッションには適用しない。

### 環境

- `.cursor/environment.json` の `install` / `start` で `pnpm exam:fetch-pdfs` が走る。`exams/{year}/` に公式 PDF が無ければ、作業前に自分で `pnpm exam:fetch-pdfs --year {year}` を実行する。
- PDF は `pnpm exam:pdf-text`（テキスト）と `pnpm exam:pdf-render`（画像）で読む。ブラウザや外部ビューアは使わない。
- 描画した PNG・抽出したテキストをコミットしない（`exams/` 配下は gitignore）。

### ブランチ・コミット・PR

- 割り当てられた作業ブランチで作業する。ブランチが指定されていなければ `q/{year}-{exam}th/{subject-id}`（類似問題）または `article/{term-id}`（用語記事）で切る。
- **`main` へ直接 push しない。**
- Cloud では、コミット → push → PR 作成までが作業範囲。手順書の「コミット・push は依頼されたときだけ」はローカル対話向けであり、Cloud では PR を開くことがタスク完了の条件。
- 1 PR = 1 科目（または 1 記事）。問題作成の PR で触るのは `src/content/questions/*.json` だけ。ページ表（`src/lib/exam-pdf-page-ranges.ts`）や PDF URL（`src/lib/exam-pdfs.ts`）の変更が必要になったら、勝手に直さず PR 本文に書いて止める。

### PR を開く前に必ず実行

```bash
pnpm build
pnpm verify:exam-pages
pnpm lint
```

すべて成功していること。失敗したら直してから PR を開く。

### PR 本文に書くこと

- 問ごとに 1 行: `AM 問13 ＝ 論点、PDF N ページ、公式正答 n`（手順書 §7「検証の記録」）。
- 知識問題は問ごとに **5 肢の真偽表**（類似問題の各肢が、問題文の問い方の下で正しいか誤りか、理由 1 行）。正解がちょうど 1 肢であることをここで示す。
- 実行した検査コマンドと結果。
- 判断に迷った点・手順書に無かったケース。

### レビューコメントへの対応

- レビューコメントで修正を求められたら、同じブランチに追加コミットで直す（force-push しない）。
- 「作り直し」と言われた問は、`sourceExplanation` だけ直して済ませず、手順書 §7-1 から再実行する。
