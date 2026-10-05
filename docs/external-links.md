# 外部リンク台帳（参考リンク）

厚生労働省の**公式問題 PDF・公式通知 PDF** 以外で、コンテンツ内からリンクしている外部 URL の一覧です。リンク切れの定期確認用。

**このファイルは生成物です。手で編集しないでください。** `pnpm exam:external-links` が問題 JSON と用語記事から集めます。最終確認日だけ、既存行があれば引き継ぎます。

- **公式 PDF** … `src/lib/exam-data.ts` と `pnpm verify:exam-pages` で管理。本台帳には載せない。
- **本台帳** … 製薬メーカー・メーカー参考情報など、**参考目的の外部リンク**のみ。

---

## エージェント向け：リンク有効性の確認

ユーザーから「外部リンクの有効性を調べて」と依頼されたら、次を実行する。

1. 下表の **URL** それぞれに HTTP でアクセスする（`curl -sI` や `fetch` など）。
2. **200** または **3xx**（最終的にページが開く）なら OK。
3. **404 / 410** ならリンク切れ。参照元ファイルを修正し、`pnpm exam:external-links` で本表を再生成する。
4. **403** … ボット対策で CLI から拒否されることがある（Bayer pharma-navi 等）。その場合はブラウザで開けるか目視確認し、結果を報告に書く。
5. 確認後、本表の **最終確認** 列を `YYYY-MM-DD` に更新してよい（再生成時は同じ URL なら日付を引き継ぐ）。

---

## 一覧

| URL | ラベル | 参照元 | 種別 | 最終確認 |
| --- | --- | --- | --- | --- |
| https://pharma-navi.bayer.jp/gadovist/basic-docs | ガドビスト（ガドブトロール）— バイエル製薬 製品情報 | `src/content/articles/gadolinium.mdx` | reference | 2026-09-08 |
| https://pharma-navi.bayer.jp/xofigo/basic-docs | ゾーフィゴ | `src/content/questions/2026-78th-pm-039.json` | reference | 2026-09-08 |
| https://pins.japic.or.jp/pdf/newPINS/00005843.pdf | アドステロール−I131 注射液 添付文書（2022 年 3 月改訂 第 2 版、JAPIC） | `src/content/articles/adrenal-cortex-scintigraphy.mdx` | reference | — |
| https://www.gehealthcare.com/ja-jp/event-and-news/news-and-initiatives/2020/press14 | マグネビスト（ガドペンテートメグルミン）— GE HealthCare に関する参考情報 | `src/content/articles/gadolinium.mdx` | reference | 2026-09-08 |
| https://www.jstage.jst.go.jp/article/endocrine/92/Suppl.September/92_1/_pdf/-char/ja | 日本内分泌学会「わが国の原発性アルドステロン症の診療に関するコンセンサス・ステートメント」 | `src/content/articles/adrenal-cortex-scintigraphy.mdx` | reference | — |
| https://www.kegg.jp/medicus-bin/japic_med?japic_code=00005843 | アドステロール−I131 注射液（KEGG MEDICUS、上記添付文書の HTML） | `src/content/articles/adrenal-cortex-scintigraphy.mdx` | reference | — |
| https://www.pdradiopharma.com/uploads/mibg_pi.pdf | ミオ MIBG−I123 注射液 添付文書（PDR ファーマ） | `src/content/articles/adrenal-cortex-scintigraphy.mdx` | reference | — |
| https://www.pmda.go.jp/safety/info-services/drugs/0001.html | PMDA の医薬品情報 | `src/content/articles/adrenal-cortex-scintigraphy.mdx` | reference | — |

---

## 追加・削除時

| 操作 | やること |
| --- | --- |
| **リンクを新規追加** | 参照元ファイルに `<a href="…" target="_blank" rel="noopener noreferrer">` を書く。`pnpm exam:external-links` で本表を再生成する。 |
| **リンクを削除** | 参照元から HTML を削除。`pnpm exam:external-links` で本表を再生成する。 |
| **URL を変更** | 参照元を直し、`pnpm exam:external-links` で本表を再生成する。 |

問題 JSON・用語記事の手順書（`exam-question-authoring.md` / `glossary-article-authoring.md`）も参照。
