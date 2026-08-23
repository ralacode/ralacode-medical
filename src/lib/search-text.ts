export function normalizeSearchText(value: string) {
  return value.normalize("NFKC").toLowerCase()
}

export function splitSearchQuery(query: string) {
  return query
    .trim()
    .split(/\s+/u)
    .map((token) => normalizeSearchText(token))
    .filter(Boolean)
}

export function matchesSearchText(haystack: string, query: string) {
  const tokens = splitSearchQuery(query)
  if (tokens.length === 0) return true

  const normalizedHaystack = normalizeSearchText(haystack)
  return tokens.every((token) => normalizedHaystack.includes(token))
}
