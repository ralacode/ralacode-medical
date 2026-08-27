/**
 * レイアウト（main.astro）と React island の間で共有する文字列の契約。
 * ここの値を変えるときは、参照している全ファイルが自動で追従する。
 * ただし main.astro の is:inline スクリプトだけは import できないため、
 * 直書きの値とコメントで対応づけている。
 */

/** ページ本文のスクロールコンテナを示す data-slot 値（main.astro ↔ question-quiz.tsx） */
export const PAGE_SCROLL_SLOT = "page-scroll"

/** ヘッダーのボタンからサイドバー開閉を伝える CustomEvent 名（main.astro ↔ app-shell.tsx） */
export const SIDEBAR_TOGGLE_EVENT = "sidebar:toggle"

/**
 * テーマの localStorage キー（theme-toggle.tsx）。
 * main.astro の is:inline スクリプトにも同じ値を直書きしている。
 */
export const THEME_STORAGE_KEY = "theme"
