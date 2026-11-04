---
description: 診療放射線技師の用語解説記事を書く。テーマだけの一文（例: 「放射線治療　標的体積」をテーマに記事を作成して）も、記事の作成・編集・リライトも、作業の最初に docs の手順書を読み、SEO の title・description・FAQ、本文の文体、国試の範囲、話し言葉の検品まで全部適用して MDX を書く。
---

ユーザーが用語解説記事の作成・編集を頼んだら、または「○○をテーマに記事を作成して」のようにテーマ・キーワード・用語名だけを渡して記事化を頼んだら、作業の最初に `docs/glossary-article-authoring.md` を読む。文体の基準は `src/content/articles/t1-t2-weighted.mdx` の「縦磁化」から「T2 とは」まで、SEO の基準は `src/content/articles/k-space.mdx`。

方針メモで終えず、手順書の SEO・本文の文体・国試の範囲・話し言葉の検品まで適用した `src/content/articles/{term-id}.mdx` を書く。ユーザーが「方針だけ」「実装しない」と言ったときだけ、ファイルは作らない。

`CLAUDE_CODE_REMOTE=true` のクラウドセッションでは、記事を書き終えたら追加の指示を待たず、コミット → push → プルリクエストまで行う。`main` へ直接 push しない。`gh pr create` は使わず、手順書の REST に従う。ローカルの Claude Code は、ユーザーが頼んだときだけコミット・push・PR する。
