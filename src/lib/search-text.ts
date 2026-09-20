const CHOICE_SNIPPET_MAX = 48

function normalizeSearchText(value: string) {
  return value.normalize("NFKC").toLowerCase()
}

function splitSearchQuery(query: string) {
  return query
    .trim()
    .split(/\s+/u)
    .map((token) => normalizeSearchText(token))
    .filter(Boolean)
}

function stripChoiceMarkup(value: string) {
  return value.replace(/\*\*/g, "").replace(/__/g, "")
}

function displayChoiceText(value: string) {
  return stripChoiceMarkup(value).normalize("NFKC")
}

function unmatchedSearchTokens(haystack: string, query: string) {
  const tokens = splitSearchQuery(query)
  const normalizedHaystack = normalizeSearchText(haystack)
  return tokens.filter((token) => !normalizedHaystack.includes(token))
}

function findTokenIndex(text: string, token: string) {
  return normalizeSearchText(text).indexOf(token)
}

function excerptAroundMatch(text: string, tokens: string[], max = CHOICE_SNIPPET_MAX) {
  let start = 0
  let length = 0
  for (const token of tokens) {
    const index = findTokenIndex(text, token)
    if (index >= 0) {
      start = index
      length = token.length
      break
    }
  }

  if (text.length <= max) return text

  const pad = Math.max(0, Math.floor((max - length) / 2))
  let from = Math.max(0, start - pad)
  const to = Math.min(text.length, from + max)
  if (to - from < max) from = Math.max(0, to - max)
  const prefix = from > 0 ? "…" : ""
  const suffix = to < text.length ? "…" : ""
  return `${prefix}${text.slice(from, to)}${suffix}`
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function emphasizeSearchTokens(text: string, tokens: string[]) {
  const unique = [...new Set(tokens.filter(Boolean))].sort(
    (left, right) => right.length - left.length
  )
  if (unique.length === 0) return text

  const pattern = new RegExp(`(${unique.map(escapeRegExp).join("|")})`, "gi")
  return text.replace(pattern, "**$1**")
}

export function matchesSearchText(haystack: string, query: string) {
  const tokens = splitSearchQuery(query)
  if (tokens.length === 0) return true

  const normalizedHaystack = normalizeSearchText(haystack)
  return tokens.every((token) => normalizedHaystack.includes(token))
}

/** 問題文だけでは足りない検索語が含まれる、最初の選択肢の抜粋 */
export function choiceSearchSnippet(
  choiceTexts: string[],
  query: string,
  primaryText: string
) {
  const tokens = unmatchedSearchTokens(primaryText, query)
  const focusTokens = tokens.length > 0 ? tokens : splitSearchQuery(query)
  if (focusTokens.length === 0) return undefined

  const choice = choiceTexts.find((text) =>
    focusTokens.some((token) =>
      normalizeSearchText(stripChoiceMarkup(text)).includes(token)
    )
  )
  if (!choice) return undefined

  const excerpt = excerptAroundMatch(displayChoiceText(choice), focusTokens)
  return `選択肢 「${emphasizeSearchTokens(excerpt, focusTokens)}」`
}
