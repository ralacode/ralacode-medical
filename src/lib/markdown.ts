import { marked } from "marked"

import { applyEmphasisToHtml } from "@/lib/emphasis"

export function renderMarkdown(source: string) {
  return marked.parse(applyEmphasisToHtml(source), { async: false, gfm: true })
}
