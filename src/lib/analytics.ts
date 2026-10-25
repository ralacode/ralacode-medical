import { withBase } from "@/lib/paths"

/** GA4 測定 ID。ページソースに出る公開値。 */
export const GA_MEASUREMENT_ID = "G-HQ5W6Z6J9V"

/** GA4 プロパティ ID（数字）。Data API の `properties/{id}`。測定 ID とは別。 */
export const GA4_PROPERTY_ID = "556142314"

/** このホストだけで計測する。localhost とプレビューは送らない。 */
export const GA_PRODUCTION_HOST = "ralacode.com"

export function privacyHref() {
  return withBase("privacy/")
}
