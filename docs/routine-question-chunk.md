# 定期実行: 類似問題を 1 塊作って PR を開く

Claude Code の Routine（定期トリガー）が、1 日 3 回ほど新しいクラウドセッションを立てて、この手順を実行する。1 回の実行で作るのは **1 塊・1 PR だけ**。人がプロンプトを作って貼る工程は、この手順で置き換える。

この手順で起動されたセッションは、**Claude Code のクラウドでも類似問題のコミット → push → PR まで行ってよい**（`docs/exam-question-authoring.md`「絶対に守ること」5 の例外）。`main` へ直接 push しない。force-push しない。

---

## 1. 予約済みの塊を集める

open の PR のタイトル先頭にある `[q:KEY]` を集める。Draft も含める。

```bash
gh api 'repos/ralacode/ralacode-medical/pulls?state=open&per_page=100' --jq '.[].title' \
  | grep -o '^\[q:[^]]*\]' | sed 's/^\[q://; s/\]$//' | paste -sd, -
```

`gh` が使えないときは GitHub の MCP ツール（`list_pull_requests`）で同じことをする。

## 2. 次の塊を決める

```bash
pnpm exam:next-chunk --skip {1 で集めた KEY をカンマ区切り}
```

- 出た 1 塊だけを作る。問番号・科目・学習タグ・複数正解・別冊・計算・採点除外は、この出力（＝マニフェスト）に従う。
- **「作業リストは空です」と出たら、作らずに止める。** 次の「止めて知らせる」へ進む。
- 塊の決め方（連続した同じ科目、12 問を超えたら学習タグの切れ目で分ける）は `docs/cloud-subject-prompt.md` と同じ。スクリプトが実装している。

### 止めて知らせる

open の Issue に、タイトル `【問題作成】作業リストが空です` のものが無ければ 1 件だけ立てる。本文には、揃った年と、次の年を始めるには年次セットアップ（`src/lib/exam-data.ts` の公式 PDF URL とページ表、`src/data/exam-manifests/{year}.json`）が要ることを書く。既にあれば何もしない。年次セットアップは、ユーザーが指示したときだけ別の PR で行う。この手順では行わない。

## 3. 作る

1. `docs/exam-question-authoring.md` を Read し、その手順と禁止事項に全部従う。
2. 公式 PDF が無ければ `pnpm exam:fetch-pdfs --year {year}`。読むのは `pnpm exam:pdf-text` / `pnpm exam:pdf-render` だけ。
3. 成果物は、出力の `files` にある `src/content/questions/*.json` だけ。ページ表・マニフェストは触らない。足りなければ PR 本文の「止めたこと」に書いて、その問は作らない。
4. 出力の「同じ科目で既にある問」と、塊の範囲外の問は触らない。
5. 厚労省公式以外の参考 URL は足さない（`docs/external-links.md` の衝突を避ける）。

## 4. 検査して PR を開く

```bash
pnpm build
pnpm lint:questions
pnpm verify:exam-pages --strict
pnpm exam:external-links --check
pnpm lint
```

全部通るまで直す。

- ブランチ: セッションに作業ブランチが指定されていればそれを使う。無ければ出力の「ブランチ案」。
- コミットメッセージ: `feat: 第{exam}回{午前|午後}問{from}〜{to}（{科目名}）の類似問題を追加する`。日本語。
- PR は REST で開く（`gh pr create` は使わない）。`base` は `main`。**Draft で開く。**
- PR タイトル: `[q:{KEY}] 第{exam}回{午前|午後}問{from}〜{to}（{科目名}）の類似問題`
- PR 本文: `.github/PULL_REQUEST_TEMPLATE/exam.md`。公式の問題文・選択肢・`exam:pdf-text` の出力は貼らない。

```bash
git push -u origin HEAD
gh api repos/ralacode/ralacode-medical/pulls -f title='…' -f head="$(git branch --show-current)" -f base=main -F draft=true -f body="$(cat pr-body.md)"
```

`pr-body.md` はコミットしない（スクラッチに置く）。

## やってはいけないこと

- 1 回の実行で 2 塊以上作る、2 本以上 PR を開く
- 予約済み（open PR がある）塊を作る
- `publishedExamYears` に年を足す（公開はユーザーの指示だけ）
- 年次セットアップ（ページ表・公式 URL・マニフェスト）をする
- 既存の問・レイアウト・CSS・コンポーネントを触る
