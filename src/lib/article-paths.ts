import { withBase } from "@/lib/paths"

export function articlesHref() {
  return withBase("articles/")
}

export function articleHref(slug: string) {
  return withBase(`articles/${slug}/`)
}

/** 一覧・関連リンク用。SEO タイトルの「｜」より前を返す。 */
export function articleDisplayTitle(title: string) {
  const [head] = title.split("｜")
  return head?.trim() || title
}
