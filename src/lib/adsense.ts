import { GA_PRODUCTION_HOST } from "@/lib/analytics"

/** AdSense パブリッシャー ID。ページソースに出る公開値。 */
export const ADSENSE_PUBLISHER_ID = "pub-6190730534637732"

/** 広告タグの `client` / `data-ad-client` に使う値。 */
export const ADSENSE_CLIENT_ID = `ca-${ADSENSE_PUBLISHER_ID}`

/** 用語解説の記事内広告ユニット。 */
export const ADSENSE_IN_ARTICLE_SLOT = "3615206403"

/** このホストだけで広告スクリプトを読む。localhost とプレビューは読まない。 */
export const ADSENSE_PRODUCTION_HOST = GA_PRODUCTION_HOST
