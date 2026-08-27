import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"

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
  /** back: 左向き矢印を左側。forward: 右向き矢印を右側（デフォルト） */
  direction?: "forward" | "back"
}

const arrowClassName = "size-6 shrink-0 text-foreground"

/** 矢印付きのカード型リンク。問題・記事一覧やナビで共通利用する */
export function LinkCard({
  href,
  label,
  title,
  description,
  bare = false,
  direction = "forward",
}: LinkCardProps) {
  const arrow =
    direction === "back" ? (
      <ArrowLeftIcon
        className={arrowClassName}
        strokeWidth={2.5}
        aria-hidden="true"
      />
    ) : (
      <ArrowRightIcon
        className={arrowClassName}
        strokeWidth={2.5}
        aria-hidden="true"
      />
    )

  const content = (
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
  )

  return (
    <a
      className={cn(
        "flex min-h-16 items-center gap-3 p-4 transition-colors hover:bg-muted/50 active:bg-muted",
        !bare && "rounded-xl border border-border bg-card"
      )}
      href={href}
    >
      {direction === "back" ? (
        <>
          {arrow}
          {content}
        </>
      ) : (
        <>
          {content}
          {arrow}
        </>
      )}
    </a>
  )
}
