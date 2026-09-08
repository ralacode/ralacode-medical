# 外部リンク台帳（参考リンク）

厚生労働省の**公式問題 PDF** 以外で、コンテンツ内からリンクしている外部 URL の一覧です。リンク切れの定期確認用。

- **公式 PDF** … `src/lib/exam-pdfs.ts` と `pnpm verify:exam-pages` で管理。本台帳には載せない。
- **本台帳** … 製薬メーカー・メーカー参考情報など、**参考目的の外部リンク**のみ。

---

## エージェント向け：リンク有効性の確認

ユーザーから「外部リンクの有効性を調べて」と依頼されたら、次を実行する。

1. 下表の **URL** それぞれに HTTP でアクセスする（`curl -sI` や `fetch` など）。
2. **200** または **3xx**（最終的にページが開く）なら OK。
3. **404 / 410** ならリンク切れ。参照元ファイルを修正し、本表を更新する。
4. **403** … ボット対策で CLI から拒否されることがある（Bayer pharma-navi 等）。その場合はブラウザで開けるか目視確認し、結果を報告に書く。
5. 確認後、**最終確認**列を `YYYY-MM-DD` に更新する。

---

## 一覧

| URL | ラベル | 参照元 | 種別 | 最終確認 |
| --- | --- | --- | --- | --- |
| https://pharma-navi.bayer.jp/xofigo/basic-docs | ゾーフィゴ（製品情報） | `src/content/questions/2026-78th-pm-039.json` | reference | 2026-09-08 |
| https://pharma-navi.bayer.jp/gadovist/basic-docs | ガドビスト（ガドブトロール）— バイエル製薬 製品情報 | `src/content/articles/gadolinium.mdx` | reference | 2026-09-08 |
| https://www.gehealthcare.com/ja-jp/event-and-news/news-and-initiatives/2020/press14 | マグネビスト — GE HealthCare に関する参考情報 | `src/content/articles/gadolinium.mdx` | reference | 2026-09-08 |

---

## 追加・削除時

| 操作 | やること |
| --- | --- |
| **リンクを新規追加** | 参照元ファイルに `<a href="…" target="_blank" rel="noopener noreferrer">` を書く。**本表に1行追加**する。 |
| **リンクを削除** | 参照元から HTML を削除。**本表から行を削除**する。 |
| **URL を変更** | 参照元と本表の両方を更新する。 |

問題 JSON・用語記事の手順書（`exam-question-authoring.md` / `glossary-article-authoring.md`）も参照。
