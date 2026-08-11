/** Join a public asset or app path with Astro `base` (`/medical/`). */
export function withBase(path = "") {
  if (/^https?:\/\//.test(path)) return path
  const base = import.meta.env.BASE_URL
  return `${base}${path.replace(/^\/+/, "")}`
}
