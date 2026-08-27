import { marked } from "marked"

import { applyEmphasisToHtml } from "@/lib/emphasis"

/** 問題文などインライン強調（**…**）だけを HTML にする。ブロック要素は付けない */
export function renderEmphasisHtml(source: string) {
  return applyEmphasisToHtml(source)
}

export function renderMarkdown(source: string) {
  return marked.parse(applyEmphasisToHtml(source), { async: false, gfm: true })
}
