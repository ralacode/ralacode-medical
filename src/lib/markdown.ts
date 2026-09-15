import { marked } from "marked"

import { applyEmphasisToHtml } from "@/lib/emphasis"

/** 問題文などインライン強調（**…**）だけを HTML にする。ブロック要素は付けない */
export function renderEmphasisHtml(source: string) {
  return applyEmphasisToHtml(source)
}

export function renderMarkdown(source: string): string {
  return marked.parse(applyEmphasisToHtml(source), {
    async: false,
    gfm: true,
  }) as string
}

/** 問題ページの解説 HTML。記事・公式 PDF リンクを別タブで開く */
export function renderQuizMarkdown(source: string) {
  return openLinksInNewTab(renderMarkdown(source))
}

const NEW_TAB_REL = ["noopener", "noreferrer"] as const

/** `<a>` に target="_blank" と rel を足す。ClientRouter が同一オリジンをクリック奪いしないよう data-astro-reload も付ける */
export function openLinksInNewTab(html: string) {
  return html.replace(/<a\b([^>]*)>/gi, (_full, rawAttrs: string) => {
    let attrs = rawAttrs

    if (/\btarget\s*=/i.test(attrs)) {
      attrs = attrs.replace(/\btarget\s*=\s*(['"]).*?\1/i, 'target="_blank"')
    } else {
      attrs += ' target="_blank"'
    }

    if (/\brel\s*=/i.test(attrs)) {
      attrs = attrs.replace(
        /\brel\s*=\s*(['"])(.*?)\1/i,
        (_match: string, quote: string, value: string) => {
          const tokens = new Set(value.split(/\s+/).filter(Boolean))
          for (const token of NEW_TAB_REL) tokens.add(token)
          return `rel=${quote}${[...tokens].join(" ")}${quote}`
        }
      )
    } else {
      attrs += ' rel="noopener noreferrer"'
    }

    if (!/\bdata-astro-reload\b/i.test(attrs)) {
      attrs += " data-astro-reload"
    }

    return `<a${attrs}>`
  })
}
