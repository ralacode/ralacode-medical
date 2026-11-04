# 定期実行: 指示されたテーマで用語記事を 1 本書いて PR を開く

Claude Code の Routine（定期トリガー）が、1 日 1 回、新しいクラウドセッションを立てて、この手順を実行する。1 回の実行で書く記事は **1 本・1 PR だけ**。

テーマはユーザーが GitHub Issue で指示する。テーマが無い日は記事を書かず、候補の Issue を提案するだけにする。

---

## 考え方: 記事は「学生の疑問」から始まる

用語が問題に出てきただけで、学生が「これを調べよう」と思うことは少ない。<br />
問題を解いていて「A と B の違いは？」「この 2 つはどういう関係？」と迷ったときに、初めて読みたくなる。

だから、記事の軸はテーマの Issue に書かれた **学生の疑問** に置く。

- 冒頭のかぎ括弧の疑問（`docs/glossary-article-authoring.md` の「本文の文体」）は、Issue の疑問から作る。
- 見出しと「まとめ」は、その疑問に答え切る順に並べる。違いを問う疑問なら、最後に対比が残るようにする。
- title / description / FAQ の SEO も、その疑問の言い方（「違い」「関係」など）を入れる。

---

## 1. ラベルを用意する（無ければ）

```bash
gh api repos/ralacode/ralacode-medical/labels -f name=article-theme -f color=0e8a16 -f description='記事テーマ（定期実行が古い順に書く）' || true
gh api repos/ralacode/ralacode-medical/labels -f name=article-candidate -f color=c5def5 -f description='記事テーマの候補（採用するなら article-theme に付け替える）' || true
```

既にあれば失敗するが、無視してよい。

## 2. テーマを 1 つ選ぶ

テーマのキューは、open の Issue のうち次のどちらかに当たるもの。

- ラベル `article-theme` が付いている
- タイトルが `【記事テーマ】` で始まる（ラベルが無いときの保険。選んだら `article-theme` を付ける）

`article-candidate` だけが付いた Issue は、まだ採用されていない候補なので書かない。

このうち、open の PR の本文に `Closes #{番号}` があるものは書きかけなので外す。残りから **作成日が最も古い 1 件** を選ぶ。

```bash
gh api 'repos/ralacode/ralacode-medical/issues?state=open&labels=article-theme&sort=created&direction=asc&per_page=50' \
  --jq '.[] | select(.pull_request == null) | "\(.number)\t\(.title)"'
gh api 'repos/ralacode/ralacode-medical/pulls?state=open&per_page=100' --jq '.[].body' | grep -o 'Closes #[0-9]*'
```

`gh` が使えないときは GitHub の MCP ツールで同じことをする。

**キューが空なら、記事は書かず「4. 候補を提案する」へ進む。**

## 3. 書いて PR を開く

1. `docs/glossary-article-authoring.md` を Read し、SEO・文体・国試の範囲・話し言葉の検品を全部適用する。
2. Issue の「テーマ」「学生の疑問」「関連する問題」「メモ」を読む。上の「考え方」に従い、疑問を記事の軸にする。
3. 記事 ID（`{term-id}`）を決める。
   - 1 つの用語の記事なら、その用語の ID（問題 JSON の `terms` に既にあればそれ）。
   - 2 つ以上の関係・違いの記事なら、まとめた ID（例: `target-volume`）。
   - **既に同じテーマの記事があるときは新規に作らない。** 疑問に答える節を既存記事に足す（編集）か、判断に迷えば Issue にコメントして、次に古い Issue へ移る。
4. 疑問が出る問題（Issue の「関連する問題」と、同じ論点の問題）の `terms` に記事 ID を足す。問題 JSON で触るのは `terms` だけ。
5. 参考リンクを足したら `pnpm exam:external-links` で台帳を再生成する。
6. 検査する。全部通るまで直す。

   ```bash
   pnpm build
   pnpm lint
   pnpm lint:questions
   pnpm exam:external-links --check
   ```

7. PR を開く。手順は `.claude/rules/glossary-article-authoring.md`（REST で開く、`gh pr create` は使わない、force-push しない）。
   - ブランチ: セッションに作業ブランチが指定されていればそれを使う。無ければ `article/{term-id}`。
   - コミットメッセージ: `feat: 用語解説記事「{テーマ}」を追加する`（編集なら `fix:`）。日本語。
   - PR 本文: `.github/pull_request_template.md`。Summary に、軸にした学生の疑問を 1 行で書く。**本文の最後に `Closes #{Issue 番号}`** を書く（マージで Issue が閉じる）。

その日は 1 本で終わる。キューに残りがあっても次は書かない。

## 4. 候補を提案する（キューが空の日だけ）

記事は書かない。コミットも PR もしない。

1. open の `article-candidate` の Issue が **9 件以上あれば、何もしないで終わる**（ユーザーが選ぶ量を超えない）。
2. `src/content/questions/*.json` を読み、学生が「A と B の違いは？」「どういう関係？」と迷いそうな組み合わせを探す。手がかり:
   - 同じ問の選択肢に、似た用語・似た数値が並んでいて、取り違えが誤答になる（例: 半価層と 1/10 価層）
   - 解説で「〜と混同しやすい」「〜ではなく〜」と書いている
   - 違う年・違う科目の問で、同じ組み合わせが繰り返し問われている
3. 次のものは外す。既存の記事（`src/content/articles/`）が既に答えている疑問、open / closed の `article-candidate` と `article-theme` の Issue と重なる疑問、国試の範囲を超える疑問。
4. 良いものを **最大 3 件**、Issue にする。ラベルは `article-candidate`。

   - タイトル: `【記事候補】{学生の疑問の一言}`（例: `【記事候補】CTV と PTV の違いは？`）
   - 本文:

     ```markdown
     ### 学生の疑問
     （かぎ括弧で 1〜3 個）

     ### どこで迷うか
     （どの問題で、どの取り違えが誤答になるか。問題 ID を書く。公式の問題文・選択肢は書かない）

     ### 関連する問題
     - 2025-77th-pm-041

     ### 記事 ID の案
     `ctv-ptv`
     ```

ユーザーが採用した候補には `article-theme` を付ける。翌日以降の実行が、そのテーマで記事を書く。

## やってはいけないこと

- 1 回の実行で 2 本以上の記事、2 本以上の PR を作る
- `article-theme` が付いていない候補を勝手に記事にする
- 公式の問題文・選択肢・別冊画像を Issue や PR に書く
- 回次・問番号を title / description / 冒頭に書く
- レイアウト・CSS・記事ページの実装を触る
