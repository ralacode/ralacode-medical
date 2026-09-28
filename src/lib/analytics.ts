import { withBase } from "@/lib/paths"

/** GA4 測定 ID。ページソースに出る公開値。 */
export const GA_MEASUREMENT_ID = "G-HQ5W6Z6J9V"

/** このホストだけで計測する。localhost とプレビューは送らない。 */
export const GA_PRODUCTION_HOST = "ralacode.com"

export function privacyHref() {
  return withBase("privacy/")
}
