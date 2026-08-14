import { marked } from "marked"

/** CommonMark の強調規則は、）**です のように閉じ括弧の直後だと ** を無視する。 */
function applyEmphasis(source: string) {
  return source
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
}

export function renderMarkdown(source: string) {
  return marked.parse(applyEmphasis(source), { async: false, gfm: true })
}
