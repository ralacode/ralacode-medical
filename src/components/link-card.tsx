import { ArrowRightIcon } from "lucide-react"

import { renderEmphasisHtml } from "@/lib/markdown"
import { cn } from "@/lib/utils"

type LinkCardProps = {
  href: string
  /** 上段のメタ情報（muted）。指定時はタイトルが下段（leading-snug）になる */
  label?: string
  title: string
  /** 下段の説明（muted）。label とは併用しない */
  description?: string
  /** 親要素（li 等）が枠線・背景を持つ場合に true */
  bare?: boolean
}

/** 矢印付きのカード型リンク。問題・記事一覧やナビで共通利用する */
export function LinkCard({ href, label, title, description, bare = false }: LinkCardProps) {
  return (
    <a
      className={cn(
        "flex min-h-16 items-center gap-3 p-4 transition-colors hover:bg-muted/50 active:bg-muted",
        !bare && "rounded-xl border border-border bg-card"
      )}
      href={href}
    >
      <span className="grid min-w-0 flex-1 gap-1">
        {label != null ? (
          <>
            <span className="text-sm text-muted-foreground">{label}</span>
            <span
              className="font-medium leading-snug"
              dangerouslySetInnerHTML={{ __html: renderEmphasisHtml(title) }}
            />
          </>
        ) : (
          <>
            <span
              className="font-medium"
              dangerouslySetInnerHTML={{ __html: renderEmphasisHtml(title) }}
            />
            {description != null ? (
              <span className="text-sm text-muted-foreground">{description}</span>
            ) : null}
          </>
        )}
      </span>
      <ArrowRightIcon
        className="size-6 shrink-0 text-foreground"
        strokeWidth={2.5}
        aria-hidden="true"
      />
    </a>
  )
}
