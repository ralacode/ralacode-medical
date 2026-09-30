import { isExamYearPreparing } from "@/lib/exam-visibility"

/** 個別の類似問題ページ。年次・科目ハブは含まない。 */
const EXAM_QUESTION_PATH = /\/exams\/\d+\/(?:am|pm)\/\d+\/?$/
const EXAM_YEAR_HUB_PATH = /\/exams\/(\d{4})\/?$/

function toPathname(urlOrPath: string) {
  const trimmed = urlOrPath.split("#")[0]?.split("?")[0] ?? urlOrPath
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    try {
      return new URL(trimmed).pathname
    } catch {
      return trimmed
    }
  }
  return trimmed
}

/** sitemap と robots 方針で共用する。フル URL でもパスでもよい。 */
export function isExamQuestionUrl(urlOrPath: string) {
  return EXAM_QUESTION_PATH.test(toPathname(urlOrPath))
}

/** 端末内の学習記録ページ。sitemap に出さない。 */
export function isPrivateStudyUrl(urlOrPath: string) {
  return /\/exams\/(?:review|session|stats)\/?$/.test(toPathname(urlOrPath))
}

/** 本番で準備中の年次ハブ。sitemap に出さない。 */
export function isPreparingExamYearUrl(urlOrPath: string) {
  const match = toPathname(urlOrPath).match(EXAM_YEAR_HUB_PATH)
  if (!match) return false
  return isExamYearPreparing(Number(match[1]))
}
